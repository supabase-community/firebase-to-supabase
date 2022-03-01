import { getFirestoreInstance, startFile, endFile, writeRecord } from './utils';
import * as fs from 'fs';
const args = process.argv.slice(2);
let startFunction, endFunction, processDocument;
if (fs.existsSync(`./${args[0]}_startFunction.js`)) {
    // read file to string
    startFunction = fs.readFileSync(`./${args[0]}_startFunction.js`, 'utf8');
}
if (fs.existsSync(`./${args[0]}_endFunction.js`)) {
    // read file to string
    endFunction = fs.readFileSync(`./${args[0]}_endFunction.js`, 'utf8');
}
if (fs.existsSync(`./${args[0]}_processDocument.js`)) {
    // read file to string
    processDocument = fs.readFileSync(`./${args[0]}_processDocument.js`, 'utf8');
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
        if (startFunction) {
            eval(startFunction);
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
        if (endFunction) {
            eval(endFunction);
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
      snapshot.forEach(fsdoc => {
        let doc = fsdoc.data();
        if (!doc.firestore_id) doc.firestore_id = fsdoc.id;
        else if (!doc.firestoreid) doc.firestoreid = fsdoc.id;   
        else if (!doc.original_id) doc.original_id = fsdoc.id;
        else if (!doc.originalid) doc.originalid = fsdoc.id;
        if (processDocument) {
            eval(processDocument);
        }
        writeRecord(collectionName, doc, recordCounters);
        data.push(doc);
      });
    })
    .catch(err => {
        error = err;
    });
    return {data, error};        
}

// export { startFile, endFile, writeRecord };