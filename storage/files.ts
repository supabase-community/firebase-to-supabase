import { getBucketName, getStorageInstance } from './utils';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: files.ts <prefix> [<batchSize>]');
    console.log('       to process the root bucket use prefix ""');
    process.exit(1);
} 
const prefix = args[0]

async function main() {
    const storage = getStorageInstance();
    storage.bucket(getBucketName()).getFiles({ prefix: prefix}).then(function(data) {
        const files = data[0];

        files.forEach(function(file) {
            console.log("***** ", file.name)
        })

    });    
    
}
main();




