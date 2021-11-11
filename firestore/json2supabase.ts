import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { keys as supabasekeys } from './supabase-keys';
import * as fs from 'fs';
import * as StreamArray from 'stream-json/streamers/StreamArray';

const args = process.argv.slice(2);
let filename;

if (args.length < 1) {
    console.log('Usage: json2supabase.ts <path_to_json_file>');
    process.exit(1);
} else {
    filename = args[0];
}

const supabase: SupabaseClient = createClient(supabasekeys.SUPABASE_URL, supabasekeys.SUPABASE_KEY);


async function main(filename: string) {

    const fields = await getFields(filename);
    console.log('fields:', JSON.stringify(fields, null, 2));

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
            return 'TEXT';
        case 'number':
            return 'NUMBER';
        case 'boolean':
            return 'BOOLEAN';
        case 'object':
            return 'JSON';
        case 'array':
            return 'JSON';
        default:
            return 'TEXT';
    }
}