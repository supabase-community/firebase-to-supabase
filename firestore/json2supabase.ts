import * as fs from 'fs';
import { Client } from 'pg';
import * as StreamArray from 'stream-json/streamers/StreamArray';

const args = process.argv.slice(2);
let filename;
let tableName;
let fields;
let client: Client;

if (args.length < 1) {
    console.log('Usage: node json2supabase.js <path_to_json_file> [<primary_key_strategy>] [<primary_key_name>]');
    console.log('  path_to_json_file: full local path and filename of .json input file');
    console.log('  primary_key_strategy (optional):');
    console.log('    none (no primary key is added');
    console.log('    serial (id SERIAL PRIMARY KEY) (autoincrementing 2-byte integer)');
    console.log('    smallserial (id SMALLSERIAL PRIMARY KEY) (autoincrementing 4-byte integer)');
    console.log('    bigserial (id BIGSERIAL PRIMARY KEY) (autoincrementing 8-byte integer)');
    console.log('    uuid (id UUID PRIMARY KEY DEFAULT uuid_generate_v4()) (randomly generated uuid)');
    console.log('    firestore_id (id TEXT PRIMARY KEY) (uses existing firestore_id random text as key)');
    console.log('  primary_key_name (optional): name of primary key (defaults to "id")');
    process.exit(1);
} else {
    filename = args[0];
}
const primary_key_strategy = args[1] || 'none';
const primary_key_name = args[2] || 'id';

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
    console.log(`analyzing fields in ${filename}`);
    fields = await getFields(filename);
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
    console.log(`creating destination table for ${filename}`);
    const tableCreationResult = await createTable(tableName, fields);
    console.log(`loading data for ${filename}`);
    const result = await loadData();
    console.log(`done processing ${filename}`);
    quit();
}
function quit() {
    client.end();
    process.exit(1);
}

async function createTable(tableName: string, fields: any) {
    return new Promise((resolve, reject) => {
        client.connect();
        client.query(`select column_name, data_type, character_maximum_length, column_default, is_nullable
        from INFORMATION_SCHEMA.COLUMNS where table_schema = 'public' and table_name = '${tableName}'`, (err, res) => {
            if (err) {
                quit();
                reject(err);
            } else {
                // console.log(JSON.stringify(res.rows, null, 2));
                if (res.rows.length > 0) {
                    for (const attr in fields) {
                        // get data_type from rows
                        const dataType = res.rows.find(row => row.column_name === attr)?.data_type;
                        if (!dataType) {
                            console.log(`field not found in ${tableName} table: ${attr}`);
                            quit();
                            reject(`field not found in ${tableName} table: ${attr}`);
                        }
                        // check to see if data_type is correct
                        if (attr === primary_key_name ? getKeyType(primary_key_strategy) === dataType : dataType !== fields[attr]) {
                            console.log(`data type mismatch for field ${attr}: ${dataType}, ${fields[attr]}`);
                            quit();
                            reject(`data type mismatch for field ${attr}: ${dataType}, ${fields[attr]}`);
                        }
                    }
                    resolve('table exists');   
                } else {
                    let sql = `create table "${tableName}" (`;
                    if (primary_key_strategy !== 'none') {
                        sql += `${createPrimaryKey(primary_key_strategy)},`;
                    }
                    for (const attr in fields) {
                        sql += `"${attr}" ${fields[attr]}, `;
                    }
                    sql = sql.slice(0, -2);
                    sql += ')';
                    client.query(sql, (err, res) => {
                        if (err) {
                            if (err.toString().endsWith('specified more than once')) {
                                console.log(err.toString() + ': try specifying a different <primary_key_name>');
                                quit();
                            } else {
                                console.log('createTable error:', err);
                                console.log('sql was: ' + sql);    
                            }
                            quit();
                            reject(err);
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
        const readStream = fs.createReadStream(filename).pipe(jsonStream.input);
    
        //You'll get json objects here
        //Key is the array-index here
        jsonStream.on('data', ({key, value}) => {
            for (const attr in value) {
                if (!fields[attr]) {
                    fields[attr] = typeof value[attr];
                }
                if ((fields[attr] !== typeof value[attr]) && fields[attr] !== 'object' && value[attr] !== null) {
                    console.log(`multiple field types found for field ${attr}: ${fields[attr]}, ${typeof value[attr]}`);
                    console.log(`casting ${attr} to type object (JSONB)`);
                    fields[attr] = 'object';
                    // quit();
                    // reject(`multiple field types found for field ${attr}: ${fields[attr]}, ${typeof value[attr]}`);
                    // process.exit(1);
                }
            }
        });
    
        jsonStream.on('end', () => {
            for (const attr in fields) {
                fields[attr] = jsToSqlType(fields[attr]);
            }
            readStream.destroy();
            jsonStream.destroy();
            resolve(fields);
        });
    
    });

}

async function loadData() {
    return new Promise((resolve, reject) => {
        let insertRows = [];
        const jsonStream = StreamArray.withParser();
        //internal Node readable stream option, pipe to stream-json to convert it for us
        fs.createReadStream(filename).pipe(jsonStream.input);
    
        //You'll get json objects here
        //Key is the array-index here
        jsonStream.on('data', async ({key, value}) => {
            let sql = `(`;

            for (const attr in fields) {
                let val = value[attr];
                if (typeof val === 'object' || fields[attr] === 'jsonb') val = JSON.stringify(val);
                if (typeof val === 'undefined') {
                    sql += `${sql.length > 1 ? ',' : ''}null`;
                } else if (fields[attr] !== 'numeric' && fields[attr] !== 'boolean') {
                    sql += `${sql.length > 1 ? ',' : ''}'${val.replace(/'/g, "''")}'`;
                } else {
                    sql += `${sql.length > 1 ? ',' : ''}${value[attr]}`;
                }
            }
            if (primary_key_strategy === 'firestore_id') {
                sql += `,'${value.firestore_id}'`;
            }
            sql += ')';
            insertRows.push(sql);
            if (insertRows.length >= 100) { // BATCH_SIZE
                const result = await runSQL(makeInsertStatement(fields, insertRows));
                insertRows = [];
            }
        });

        jsonStream.on('error', (err) => {
            console.log('loadData error', err);
        });

        jsonStream.on('end', async () => {
            const result = await runSQL(makeInsertStatement(fields, insertRows));
            resolve('DONE');
        });
    
    });

}
function makeInsertStatement(fields: any, insertRows: any) {
    let fieldList = '';
    for (const attr in fields) {
        fieldList += `${fieldList.length > 0 ? ',' : ''}"${attr}"`;
    }
    if (primary_key_strategy === 'firestore_id') {
        fieldList += `,${primary_key_name}`;        
    }

    let sql = `insert into "${tableName}" (${fieldList}) values ${insertRows.join(',')}`;
    fs.writeFileSync('temp.sql',sql, 'utf8');
    return sql;
}

async function runSQL(sql: string) {
    return new Promise((resolve, reject) => {
        // fs.writeFileSync(`temp.sql`, sql, 'utf-8');
        client.query(sql, (err, res) => {
            if (err) {
                console.log('runSQL error:', err);
                console.log('sql was: ' + sql);
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
function createPrimaryKey(primary_key_strategy: string) {
    switch (primary_key_strategy) {
        case 'none':
            return '';
        case 'serial':
            return `"${primary_key_name}" SERIAL PRIMARY KEY`;
        case 'smallserial':
            return `"${primary_key_name}" SMALLSERIAL PRIMARY KEY`;
        case 'bigserial':
            return `"${primary_key_name}" BIGSERIAL PRIMARY KEY`;
        case 'uuid':
            return `"${primary_key_name}" UUID PRIMARY KEY DEFAULT uuid_generate_v4()`;
        case 'firestore_id':
            return `"${primary_key_name}" TEXT PRIMARY KEY`;
        default:
            return '';
    }
}

main(filename);
