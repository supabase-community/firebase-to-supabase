import { existsSync, mkdirSync } from 'fs';

import { getBucketName, getStorageInstance } from './utils';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node files.js <prefix> <mode> [<batchSize>] [<limit>]');
    console.log('       <prefix>: the prefix of the files to download');
    console.log('                 to process the root bucket use prefix ""');
    console.log('       <mode>: "single" to download/upload one file at a time');
    console.log('               "batch" to download/upload a batch of files at a time');
    console.log('               "download" to download files only');
    console.log('               "upload" to upload files only');
    console.log('               "count" to get a matching file count');
    console.log('               "list" to get a matching list of file names');
    console.log('       <batchSize>: (optional), default is 100');
    console.log('       <limit>: (optional), stop after processing this many files');
    process.exit(1);
} 
const prefix = args[0]
const mode = args[1] || '';
if ([ 'single', 'batch', 'download', 'upload', 'count', 'list' ].indexOf(mode) < 0) {
    console.error('Invalid mode: ', mode);
    console.log('mode must be one of: single, batch, download, upload, count, list');
    process.exit(1);
}
let batchSize: number;
let limit: number;
let count = 0;

// GetFilesOptions: 
// https://googleapis.dev/nodejs/storage/latest/global.html#GetFilesOptions
//
try {
    batchSize = parseInt(args[2] || '100');
} catch (err) {
    console.error('error setting batchSize:');
    console.error(err);
    process.exit(1);
}
try {
    limit = parseInt(args[3] || '0');
} catch (err) {
    console.error('error setting limit:');
    console.error(err);
    process.exit(1);
}
try {
    if (!existsSync('./tmp')) {
      mkdirSync('./tmp');
    }
} catch (err) {
    console.error('error creating ./tmp folder:');
    console.error(err);
    process.exit(1);
}

const storage = getStorageInstance();

async function getBatch(query: any) {
    const [files, queryForNextPage]  = await storage.bucket(getBucketName())
    .getFiles(query);
    let c = 0;
    files.forEach(async function(file) {
        count++;
        switch (mode) {
            case 'single':
                break;
            case 'batch':
                break;
            case 'download':
                break;
            case 'upload':
                break;
            case 'count':
                break;
            case 'list':
                console.log(file.name);
                break;
            default:
                console.log('unknown mode: ', mode);
                process.exit(1);
        }
        const [err] = await storage.bucket(getBucketName())
            .file(file.name).download({destination: `./tmp/${encodeURIComponent(file.name)}`});
        if (err) {
            console.error('Error downloading file', err);
        }
        c++;
    })
    // console.log('***** ', c, ' files in batch')
    if (queryForNextPage) {
        //getBatch(queryForNextPage);
    } else {
        switch (mode) {
            case 'single':
                break;
            case 'batch':
                break;
            case 'download':
                break;
            case 'upload':
                break;
            case 'count':
                console.log('count: ', count);
                process.exit(0);
                break;
            case 'list':
                console.log(`${count} files found`);
                process.exit(0);
                break;
            default:
                console.log('unknown mode: ', mode);
                process.exit(1);
        }
    }
}
async function main() {
    const startQuery = { 
        prefix: prefix, 
        autoPaginate: false, 
        maxResults: batchSize };
    getBatch(startQuery);
}
main();




