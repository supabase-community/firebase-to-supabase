import { existsSync, mkdirSync } from 'fs';

import { getBucketName, getStorageInstance } from './utils';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node download.js <prefix> [<folder>] [<batchSize>] [<limit>] [<token>]');
    console.log('       <prefix>: the prefix of the files to download');
    console.log('                 to process the root bucket use prefix ""');
    console.log('       <folder>: (optional), name of subfolder for downloaded files, default is "downloads"');
    console.log('       <batchSize>: (optional), default is 100');
    console.log('       <limit>: (optional), stop after processing this many files');
    console.log('       <token>: (optional), begin processing at this pageToken');
    process.exit(1);
} 
const prefix = args[0]
let batchSize: number;
let limit: number = 0;
let count: number = 0;
let downloaded: number = 0;
let token: string = '';
let folder: string = 'downloads';
/*

{
  prefix: '',
  autoPaginate: false,
  maxResults: 100,
  pageToken: 'xxxxxxxxxxxxxxxxxxxx'
}

*/
// GetFilesOptions: 
// https://googleapis.dev/nodejs/storage/latest/global.html#GetFilesOptions
//
try {
    if (args[1]){
        folder = args[1];
    }
    // check if folder is a valid folder name
    if (!folder.match(/^[a-zA-Z0-9_\-]+$/)) {
        console.log('folder name must be alphanumeric');
        process.exit(1);
    }
    if (!existsSync(`./${folder}`)) {
      mkdirSync(`./${folder}`);
    }
} catch (err) {
    console.error('error creating ./downloads folder:');
    console.error(err);
    process.exit(1);
}

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
    if (args[4]) {
        token = args[4];
        if (token.length !== 20) {
            console.error('token must be 20 characters long');
            process.exit(1);        
        }
    }
} catch (err) {
    console.error('error in token:');
    console.error(err);
    process.exit(1);
}

const storage = getStorageInstance();

async function processBatch(fileSet: File[], queryForNextPage: any) {
    if (fileSet.length > 0) {
        const file = fileSet.shift();
        try {
            console.log('downloading: ', file.name);
            const [err] = await storage.bucket(getBucketName())
            .file(file.name)
            .download({destination: `./${folder}/${encodeURIComponent(file.name)}`});
            if (err) {
                console.error('Error downloading file', err);
            } else {
                downloaded++;
            }
            processBatch(fileSet, queryForNextPage);   
        } catch (err) {
            console.log('err', err);
        }
    } else {
        if (queryForNextPage && (limit === 0 || count < limit)) {
            getBatch(queryForNextPage);
        } else {
            console.log(`done: downloaded ${downloaded} files`);
            process.exit(0);
        }
    }
}

async function getBatch(query: any) {
    const fileSet = [];
    const [files, queryForNextPage]  = await storage.bucket(getBucketName())
    .getFiles(query);
    let c = 0;
    files.forEach(async function(file) {
        if (!file.name.endsWith('/')) { // skip folders
            count++;
            c++;
            if (limit === 0 || count <= limit) {
                fileSet.push(file);
            }
        }
    });
    // console.log('prepared batch of ', fileSet.length, ' files')
    processBatch(fileSet, queryForNextPage);
}
 
async function main() {
    const startQuery = { 
        prefix: prefix, 
        autoPaginate: false, 
        maxResults: batchSize,
        pageToken: token 
    };
    getBatch(startQuery);
}
main();




