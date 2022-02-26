import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';

import { keys } from './supabase-keys';

const supabase: SupabaseClient = createClient(keys.SUPABASE_URL, keys.SUPABASE_KEY);

const args = process.argv.slice(2);
if (args.length < 3) {
    // console.log('Usage: node upload.js <prefix> <folder> <bucket> [<batchSize>] [<limit>] [<token>]');
    console.log('Usage: node upload.js <prefix> <folder> <bucket>');
    console.log('       <prefix>: the prefix of the files to download');
    console.log('                 to process all files use prefix ""');
    console.log('       <folder>: name of subfolder of files to upload, default is "downloads"');
    console.log('       <bucket>: name of bucket to upload to');
    // console.log('       <batchSize>: (optional), default is 100');
    // console.log('       <limit>: (optional), stop after processing this many files');
    // console.log('       <token>: (optional), begin processing at this pageToken');
    process.exit(1);
}

const prefix = args[0] || '';
const folder = args[1] || 'downloads';
const bucket = args[2] || '';

let files: string[] = [];
let totalCount = 0;
let count = 0;

// get list of files in folder
try {
    console.log('reading files from:', `./${folder}`);
    files = readdirSync(`./${folder}`).filter(file => file.startsWith(prefix));
    totalCount = files.length;
    console.log('found', files.length, 'files');
} catch (err) {
    console.error('error reading ./downloads folder:');
    console.error(err);
    process.exit(1);
}

const createBucket = async (bucket: string) => {
    console.log('...creating bucket:', bucket);
    const { data, error } = await supabase
        .storage
        .createBucket(bucket, { public: false });
    if (error) {
        if (error.message === `duplicate key value violates unique constraint "buckets_pkey"`) {
            // bucket already exists
            console.log(`bucket ${bucket} already exists`);
        } else {
            console.error('error creating bucket:', error);
            process.exit(1);    
        }
    } else {
        return data;
    }
}
const processBatch = async (files: string[]) => {
    if (files.length === 0) {
        console.log('done');
        return;
    }
    else {
        const file = files.shift();
        count++;
        console.log(`uploading ${count} of ${totalCount} to bucket ${bucket}: ${file}`);
        // get file contents
        const contents = readFileSync(`./${folder}/${file}`);
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(`${decodeURIComponent(file)}`, contents, {
                cacheControl: '3600',
                upsert: true
            });
        if (error) {
            console.error('error uploading file:', error);
            process.exit(1);
        } else {
            processBatch(files);
        }
    }
}
const mainLoop = async () => {
    const result = await createBucket(bucket);
    console.log('...created bucket:', result);
    processBatch(files);
}
mainLoop();