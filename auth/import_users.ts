import * as fs from 'fs';
import * as moment from 'moment';
import { Client } from 'pg';
import * as StreamArray from 'stream-json/streamers/StreamArray';

const args = process.argv.slice(2);
let filename;
let client: Client;

if (args.length < 1) {
    console.log('Usage: node import_users.js <path_to_json_file> [<batch_size>]');
    console.log('  path_to_json_file: full local path and filename of .json input file (of users)');
    console.log('  batch_size: number of users to process in a batch (defaults to 100)');
    process.exit(1);
} else {
    filename = args[0];
}
const BATCH_SIZE = parseInt(args[1],10) || 100;
if (!BATCH_SIZE || typeof BATCH_SIZE !== 'number' || BATCH_SIZE < 1) {
    console.log('invalid batch_size');
    process.exit(1);
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
          new Batch({batchSize: BATCH_SIZE})
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
    const sql = createUserHeader() + rows.join(',\n') + 'ON CONFLICT DO NOTHING;';
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
