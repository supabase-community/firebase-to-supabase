import { getBucketName, getStorageInstance } from './utils';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: files.ts <prefix> [<batchSize>]');
    console.log('       to process the root bucket use prefix ""');
    console.log('       batchSize is optional, default is 100');
    process.exit(1);
} 
const prefix = args[0]
const batchSize = args[1] || '100';

// GetFilesOptions: 
// https://googleapis.dev/nodejs/storage/latest/global.html#GetFilesOptions
//
const storage = getStorageInstance();

async function getBatch(query: any) {
    const [files, queryForNextPage]  = await storage.bucket(getBucketName())
    .getFiles(query);
    let c = 0;
    files.forEach(function(file) {
        console.log("***** ", file.name)
        c++;
    })
    console.log('***** ', c, ' files found')
    if (queryForNextPage) {
        getBatch(queryForNextPage);
    } else {
        console.log('no more files to process..');
    }
}
async function main() {
    let batch = 100;
    try {
        if (batchSize) {
            batch = parseInt(batchSize);
        }
    } catch (e) {
        batch = 100;
    }
    const startQuery = { 
        prefix: prefix, 
        autoPaginate: false, 
        maxResults: batch };
    getBatch(startQuery);

}
main();




