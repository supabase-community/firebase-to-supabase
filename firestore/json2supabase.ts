import * as fs from 'fs';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import { Client } from 'pg';

const args = process.argv.slice(2);
let filename;
let tableName;
let client: Client;

if (args.length < 1) {
    console.log('Usage: json2supabase.ts <path_to_json_file>');
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

    const fields = await getFields(filename);
    // console.log('fields:', JSON.stringify(fields, null, 2));
    client = new Client({
        user: pgCreds.user,
        host: pgCreds.host,
        database: pgCreds.database,
        password: pgCreds.password,
        port: pgCreds.port
      });
    // parse table name from filename / path
    tableName = filename.replace(/\\/g,'/').split('/').pop().split('.')[0].replace('.json', '');
    const tableCreationResult = await createTable(tableName, fields);
    console.log('tableCreationResult:', tableCreationResult);
    client.end();
}

async function createTable(tableName: string, fields: any) {
    return new Promise((resolve, reject) => {
        client.connect();
        client.query(`select column_name, data_type, character_maximum_length, column_default, is_nullable
        from INFORMATION_SCHEMA.COLUMNS where table_name = '${tableName}'`, (err, res) => {
            if (err) {
                console.log('createTable error:', err);
                client.end()
                reject(err);
                process.exit(1);
            } else {
                // console.log(JSON.stringify(res.rows, null, 2));
                if (res.rows.length > 0) {
                    for (const attr in fields) {
                        // get data_type from rows
                        const dataType = res.rows.find(row => row.column_name === attr).data_type;
                        if (!dataType) {
                            console.log(`field not found in ${tableName} table: ${attr}`);
                            client.end()
                            reject(`field not found in ${tableName} table: ${attr}`);
                            process.exit(1);
                        }
                        if (dataType !== fields[attr]) {
                            console.log(`data type mismatch for field ${attr}: ${dataType}, ${fields[attr]}`);
                            client.end()
                            reject(`data type mismatch for field ${attr}: ${dataType}, ${fields[attr]}`);
                            process.exit(1);
                        }
                    }
                    resolve('table exists');   
                } else {
                    let sql = `create table "${tableName}" (`;
                    for (const attr in fields) {
                        sql += `"${attr}" ${fields[attr]}, `;
                    }
                    sql = sql.slice(0, -2);
                    sql += ')';
                    console.log(sql);
                    client.query(sql, (err, res) => {
                        if (err) {
                            console.log('createTable error:', err);
                            reject(err);
                            client.end()
                            process.exit(1);
                        } else {
                            // console.log('table created', JSON.stringify(res, null, 2));
                            resolve('table created');
                        }
                    });
                }
            }
          });    
    });
}

async function getFields(filename: string) {
    return new Promise((resolve, reject) => {
        const jsonStream = StreamArray.withParser();
        const fields: any = {};
    
        //internal Node readable stream option, pipe to stream-json to convert it for us
        fs.createReadStream(filename).pipe(jsonStream.input);
    
        //You'll get json objects here
        //Key is the array-index here
        jsonStream.on('data', ({key, value}) => {
            for (const attr in value) {
                if (!fields[attr]) {
                    fields[attr] = typeof value[attr];
                }
                if (fields[attr] !== typeof value[attr]) {
                    console.log(`multiple field types found for field ${attr}: ${fields[attr]}, ${typeof value[attr]}`);
                    reject(`multiple field types found for field ${attr}: ${fields[attr]}, ${typeof value[attr]}`);
                    // process.exit(1);
                }
            }
        });
    
        jsonStream.on('end', () => {
            for (const attr in fields) {
                fields[attr] = jsToSqlType(fields[attr]);
            }
            resolve(fields);
        });
    
    });

}
main(filename);

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