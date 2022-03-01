import { getFirestoreInstance, startFile, endFile, writeRecord } from './utils';
import * as fs from 'fs';
const args = process.argv.slice(2);
let subprocess;
if (fs.existsSync(`./${args[0]}.js`)) {
    subprocess = require(`./${args[0]}.js`);
}

let db;

const recordCounters = {};
let limit = 0;

if (args.length < 1) {
    console.log('Usage: firestore2json.ts <collectionName> [<batchSize>] [<limit>]');
    process.exit(1);
} else {
    db = getFirestoreInstance();
    main(args[0], args[1] || '1000', args[2] || '0');
}

async function main(collectionName: string, batchSize: string, limit: string) {
    if (fs.existsSync(`./${collectionName}.json`)) {
        console.log(`${collectionName}.json already exists, aborting...`);
        process.exit(1);
    } else {
        startFile(collectionName, recordCounters);
        if (subprocess && subprocess.startFunction) {
            subprocess.startFunction(collectionName, recordCounters);
        }
        await getAll(collectionName, 0, parseInt(batchSize), parseInt(limit));
    }
    
}

async function getAll(collectionName: string, offset: number, batchSize: number, limit: number) {
    const {data, error } = await getBatch(collectionName, offset, batchSize, limit);
    if (data.length > 0) {
        await getAll(collectionName, offset + data.length, batchSize, limit);
    } else {
        endFile(collectionName);
        if (subprocess && subprocess.endFunction) {
            subprocess.endFunction(collectionName);
        }
        console.log(`${recordCounters[collectionName]} records written to ${collectionName}.json`);
    }
}

async function getBatch(collectionName: string, offset: number, batchSize: number, limit: number): Promise<{data: any[], error: any}> {
    const data = [];
    let error = null;
    if (recordCounters[collectionName] >= limit) {
        return {data, error};
    }
    if (limit > 0) {
        batchSize = Math.min(batchSize, limit - recordCounters[collectionName]);
    }
    await db.collection(collectionName)
    .limit(batchSize)
    .offset(offset)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        let item = doc.data();
        if (!item.firestore_id) item.firestore_id = doc.id;
        else if (!item.firestoreid) item.firestoreid = doc.id;   
        else if (!item.original_id) item.original_id = doc.id;
        else if (!item.originalid) item.originalid = doc.id;
        if (subprocess) {
            item = subprocess.processDocument(item, recordCounters);
        }
        writeRecord(collectionName, item, recordCounters);
        data.push(item);
      });
    })
    .catch(err => {
        error = err;
    });
    return {data, error };        
}

export { startFile, endFile, writeRecord };