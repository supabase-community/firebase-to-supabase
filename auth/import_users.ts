import * as fs from 'fs';
import { Client } from 'pg';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import * as moment from 'moment';

const args = process.argv.slice(2);
let filename;
let client: Client;

if (args.length < 1) {
    console.log('Usage: node import_users.js <path_to_json_file>');
    console.log('  path_to_json_file: full local path and filename of .json input file (of users)');
    process.exit(1);
} else {
    filename = args[0];
}

let pgCreds;
try {
    pgCreds = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
    if (typeof pgCreds.user === 'string' &&
        typeof pgCreds.password === 'string' &&
        typeof pgCreds.host === 'string' &&
        typeof pgCreds.port === 'number' &&
        typeof pgCreds.database === 'string') {} else {
            console.log('supabase-service.json must contain the following fields:');
            console.log('   user: string');
            console.log('   password: string');
            console.log('   host: string');
            console.log('   port: number');
            console.log('   database: string');
            process.exit(1);
        }
} catch (err) {
    console.log('error reading supabase-service.json', err);
    process.exit(1);
}

async function main(filename: string) {
    client = await new Client({
        user: pgCreds.user,
        host: pgCreds.host,
        database: pgCreds.database,
        password: pgCreds.password,
        port: pgCreds.port
      });
    client.connect();

    console.log(`loading users from ${filename}`);
    await loadUsers(filename);
    console.log(`done processing ${filename}`);
    quit();
}
function quit() {
    client.end();
    process.exit(1);
}

async function loadUsers(filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const Batch = require('stream-json/utils/Batch');
        let insertRows = [];

        const StreamArray = require('stream-json/streamers/StreamArray');
        const {chain} = require('stream-chain');
        const fs = require('fs');
        
        const pipeline = chain([
          fs.createReadStream(filename),
          StreamArray.withParser(),
          new Batch({batchSize: 10})
        ]);
        
        // count all odd values from a huge array
        
        let oddCounter = 0;
        pipeline.on('data', async data => {
          data.forEach(item => {
            // console.log('user', user);
            const index = item.key;
            const user = item.value;
            insertRows.push(createUser(user));
          });
          console.log('insertUsers:', insertRows.length);
          pipeline.pause();
          const result = await insertUsers(insertRows);
          insertRows = [];
          pipeline.resume();
        });
        pipeline.on('end', () => {
            console.log('finished');
            resolve('');
        });
    
    });    
}

async function loadUsers_old(filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
        let insertRows = [];
        const jsonStream = StreamArray.withParser();
        //internal Node readable stream option, pipe to stream-json to convert it for us
        fs.createReadStream(filename).pipe(jsonStream.input);
    
        fs.writeFileSync(`./queue.tmp`, '', 'utf-8');       

        //You'll get json objects here
        //Key is the array-index here
        jsonStream.on('data', async ({key, value}) => {
            console.log('on data', key);
            const index = key;
            const user = value;
            insertRows.push(createUser(user));
            fs.appendFileSync(`./queue.tmp`, createUser(user) + '\n', 'utf-8');       
            console.log('insertRows.length', insertRows.length);
            if (insertRows.length >= 10) {
                console.log('calling insertUsers');
                //const result = await insertUsers(insertRows);
                //console.log('insertUsers result', result);
                //quit();
                //insertRows = [];
            }

        });

        jsonStream.on('error', (err) => {
            console.log('loadUsers error', err);
            quit();
        });

        jsonStream.on('end', async () => {
            console.log('loadUsers end...');
            if (insertRows.length > 0) {
                const result = await insertUsers(insertRows);
                console.log('insertUsers result', result);
                insertRows = [];
                resolve('done');
            }
        });
    });

}

async function insertUsers(rows: any[]): Promise<any> {
    const sql = createUserHeader() + rows.join(',\n');
    // console.log('sql', sql);
    const result = await runSQL(sql);
    return result;   
}

function formatDate(date: string) {
    return moment.utc(date).toISOString();
}
async function runSQL(sql: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
        // fs.writeFileSync(`temp.sql`, sql, 'utf-8');
        client.query(sql, (err, res) => {
            if (err) {
                console.log('runSQL error:', err);
                console.log('sql was: ');
                console.log(sql);
                quit();
                reject(err);
            } else {
                resolve(res);
            }
        });     
    });
}

function jsToSqlType(type: string) {
    switch (type) {
        case 'string':
            return 'text';
        case 'number':
            return 'numeric';
        case 'boolean':
            return 'boolean';
        case 'object':
            return 'jsonb';
        case 'array':
            return 'jsonb';
        default:
            return 'text';
    }
}
function getKeyType(primary_key_strategy: string) {
    switch (primary_key_strategy) {
        case 'none':
            return '';
        case 'serial':
            return 'integer';
        case 'smallserial':
            return 'smallint';
        case 'bigserial':
            return 'bigint';
        case 'uuid':
            return 'uuid';
        case 'firestore_id':
            return 'text';
        default:
            return '';
    }
}

main(filename);

function createUserHeader() {
    return `INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status    
    ) VALUES `;
}
function createUser(user: any) {
    const sql = `(
        '00000000-0000-0000-0000-000000000000', /* instance_id */
        uuid_generate_v4(), /* id */
        'authenticated', /* aud character varying(255),*/
        'authenticated', /* role character varying(255),*/
        '${user.email}', /* email character varying(255),*/
        '', /* encrypted_password character varying(255),*/
        ${user.emailVerified ? 'NOW()' : 'null'}, /* email_confirmed_at timestamp with time zone,*/
        '${formatDate(user.metadata.creationTime)}', /* invited_at timestamp with time zone, */
        '', /* confirmation_token character varying(255), */
        null, /* confirmation_sent_at timestamp with time zone, */
        '', /* recovery_token character varying(255), */
        null, /* recovery_sent_at timestamp with time zone, */
        '', /* email_change_token_new character varying(255), */
        '', /* email_change character varying(255), */
        null, /* email_change_sent_at timestamp with time zone, */
        null, /* last_sign_in_at timestamp with time zone, */
        '${getProviderString(user.providerData)}', /* raw_app_meta_data jsonb,*/
        '{"fbuser":${JSON.stringify(user)}}', /* raw_user_meta_data jsonb,*/
        false, /* is_super_admin boolean, */
        NOW(), /* created_at timestamp with time zone, */
        NOW(), /* updated_at timestamp with time zone, */
        null, /* phone character varying(15) DEFAULT NULL::character varying, */
        null, /* phone_confirmed_at timestamp with time zone, */
        '', /* phone_change character varying(15) DEFAULT ''::character varying, */
        '', /* phone_change_token character varying(255) DEFAULT ''::character varying, */
        null, /* phone_change_sent_at timestamp with time zone, */
        '', /* email_change_token_current character varying(255) DEFAULT ''::character varying, */
        0 /*email_change_confirm_status smallint DEFAULT 0 */   
    )`;
    return sql;
}

function getProviderString(providerData: any[]) {
    const providers = [];
    for (let i = 0; i < providerData.length; i++) {
        const p = providerData[i].providerId.toLowerCase().replace('.com', '');
        let provider = 'email';
        switch (p) {
            case 'password':
                provider = 'email';
                break;
            case 'google':
                provider = 'google';
                break;
            case 'facebook':
                provider = 'facebook';
                break;
        }
        providers.push(provider);
    }
    const providerString = `{"provider": "${providers[0]}","providers":["${providers.join('","')}"]}`;
    return providerString;
}
/*

user:
{
  uid: '14PpgFLYqaY9CM20HnrpcFLKdfb2',
  email: 'pj.martins.805+lastone@gmail.com',
  emailVerified: true,
  displayName: 'newclient',
  disabled: false,
  metadata: {
    lastSignInTime: 'Sat, 13 Jun 2020 15:05:37 GMT',
    creationTime: 'Sat, 13 Jun 2020 15:05:37 GMT'
  },
  passwordHash: 'V5DiMiY8dgVfHD5Pk6YPQZYA-StNzy-G5lDc56dIlgqVWAVHvtup10CzudiDvX-3zrzERm4dAZt6zXQ2vHpUuA==',
  passwordSalt: 'r6SSrPzDvqCoKA==',
  customClaims: { roles: { Client: true } },
  tokensValidAfterTime: 'Sat, 13 Jun 2020 15:05:37 GMT',
  providerData: [
    {
      uid: 'pj.martins.805+lastone@gmail.com',
      displayName: 'newclient',
      email: 'pj.martins.805+lastone@gmail.com',
      providerId: 'password'
    }
  ]
},{
  "uid": "ON0Vizp7P4cv5RxFKr5yriHEr0K3",
  "email": "holman@webcooker.com",
  "emailVerified": false,
  "displayName": "Steve Holman",
  "photoURL": "https://graph.facebook.com/2979715025379826/picture",
  "disabled": false,
  "metadata": {
    "lastSignInTime": "Thu, 07 May 2020 15:36:35 GMT",
    "creationTime": "Thu, 07 May 2020 01:06:32 GMT"
  },
  "customClaims": {
    "roles": {
      "Agent": true
    },
    "userLevel": 500
  },
  "tokensValidAfterTime": "Thu, 07 May 2020 01:06:32 GMT",
  "providerData": [
    {
      "uid": "2979715025379826",
      "displayName": "Steve Holman",
      "email": "holman@webcooker.com",
      "photoURL": "https://graph.facebook.com/2979715025379826/picture",
      "providerId": "facebook.com"
    }
  ]
},{
  "uid": "a7ElKMzIUCY1fjhH2p1OKlv1V5p1",
  "email": "vineet.harbhajanka@gmail.com",
  "emailVerified": true,
  "displayName": "Vineet Harbhajanka",
  "photoURL": "https://lh5.googleusercontent.com/-j96xbbDA0Ds/AAAAAAAAAAI/AAAAAAAAEME/hyH8N4wiZ90/photo.jpg",
  "disabled": false,
  "metadata": {
    "lastSignInTime": "Wed, 12 Jun 2019 04:31:21 GMT",
    "creationTime": "Wed, 12 Jun 2019 04:31:21 GMT"
  },
  "tokensValidAfterTime": "Wed, 12 Jun 2019 04:31:21 GMT",
  "providerData": [
    {
      "uid": "117302040858727286669",
      "displayName": "Vineet Harbhajanka",
      "email": "vineet.harbhajanka@gmail.com",
      "photoURL": "https://lh5.googleusercontent.com/-j96xbbDA0Ds/AAAAAAAAAAI/AAAAAAAAEME/hyH8N4wiZ90/photo.jpg",
      "providerId": "google.com"
    }
  ]
},



CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone character varying(15) DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change character varying(15) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))


    2021-09-01T22:13:02.940Z

| instance_id                          | id                                   | aud           
| ------------------------------------ | ------------------------------------ | ------------- 
| 00000000-0000-0000-0000-000000000000 | 6d365b2a-6368-4603-9091-c4646a6ed524 | authenticated 

| role          | email                                  
| ------------- | -------------------------------------- 
| authenticated | markb+testautocreation@mantisbible.com 

| encrypted_password                                           | email_confirmed_at | invited_at 
| ------------------------------------------------------------ | ------------------ | ---------- 
| $2a$10$xlAjAkWOCa3sRotrcprqseOtnKrNq4o6z4e1/XtLN2QCkJ1.nLofG | null               | null           

| confirmation_token     | confirmation_sent_at     | recovery_token | recovery_sent_at 
| ---------------------- | ------------------------ | -------------- | ---------------- 
| yKoGUgRpbzbUQOjMPL1B2w | 2021-09-01T22:13:02.940Z |                | null                

| email_change_token_new | email_change | email_change_sent_at | last_sign_in_at | raw_app_meta_data 
| ---------------------- | ------------ | -------------------- | --------------- | ----------------- 
|                        |              |  null                | null            | {"provider": "email","providers":["email"]}  

| raw_user_meta_data | is_super_admin | created_at               | updated_at               | phone 
| ------------------ | -------------- | ------------------------ | ------------------------ | ----- 
| null               | false          | 2021-09-01T22:13:02.935Z | 2021-09-01T22:13:02.935Z | null      

| phone_confirmed_at | phone_change | phone_change_token | phone_change_sent_at | confirmed_at 
| ------------------ | ------------ | ------------------ | -------------------- | ------------ 
| null               |              |                    | null                 | null             

| email_change_token_current | email_change_confirm_status |
| -------------------------- | --------------------------- |
|                            | 0                           |


unconfirmed user:

| instance_id                          | id                                   | aud           | role          | email                  | encrypted_password                                           | email_confirmed_at | invited_at | confirmation_token     | confirmation_sent_at     | recovery_token | recovery_sent_at | email_change_token_new | email_change | email_change_sent_at | last_sign_in_at | raw_app_meta_data | raw_user_meta_data | is_super_admin | created_at               | updated_at               | phone | phone_confirmed_at | phone_change | phone_change_token | phone_change_sent_at | confirmed_at | email_change_token_current | email_change_confirm_status |
| ------------------------------------ | ------------------------------------ | ------------- | ------------- | ---------------------- | ------------------------------------------------------------ | ------------------ | ---------- | ---------------------- | ------------------------ | -------------- | ---------------- | ---------------------- | ------------ | -------------------- | --------------- | ----------------- | ------------------ | -------------- | ------------------------ | ------------------------ | ----- | ------------------ | ------------ | ------------------ | -------------------- | ------------ | -------------------------- | --------------------------- |
| 00000000-0000-0000-0000-000000000000 | 51b03352-ea26-41ad-be3a-703bde930be8 | authenticated | authenticated | markb+smtp1@dmarie.com | $2a$10$adZbKGy/igTsDOaOgwQd8eEeDj8ygcwCn0ncZIHYsOdzH2sSRaqcG |                    |            | Ko89asihMTk-KgkSPgmGVQ | 2021-11-19T01:08:25.736Z |                |                  |                        |              |                      |                 | [object Object]   | [object Object]    | false          | 2021-11-19T01:06:00.437Z | 2021-11-19T01:06:00.437Z |       |                    |              |                    |                      |              |                            | 0                           |
*/