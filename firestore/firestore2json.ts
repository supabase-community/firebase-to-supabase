import { getFirestoreInstance } from './utils';
import * as fs from 'fs';

const args = process.argv.slice(2);
let db;

if (args.length < 1) {
    console.log('Usage: firestore2json.ts <collectionName> [<batchSize>]');
    process.exit(1);
} else {
    db = getFirestoreInstance();
    main(args[0], args[1] || '1000');
}

async function main(collectionName: string, batchSize: string) {

    getAll(collectionName, 0, parseInt(batchSize));
    
}

async function getAll(collectionName: string, offset: number, limit: number) {
    const {data, error } = await getBatch(collectionName, offset, limit);
    if (data.length > 0) {
        await getAll(collectionName, offset + data.length, limit);
    } else {
        fs.appendFileSync(`./${collectionName}.json`, 
        ']', 
        'utf8');    
    }
}

async function getBatch(collectionName: string, offset: number, limit: number): Promise<{data: any[], error: any}> {
    const data = [];
    let error = null;
    let count = 0;
    await db.collection(collectionName)
    .limit(limit)
    .offset(offset)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const item = doc.data();
        if (!item.firestore_id) item.firestore_id = doc.id;
        else if (!item.firestoreid) item.firestoreid = doc.id;   
        else if (!item.original_id) item.original_id = doc.id;
        else if (!item.originalid) item.originalid = doc.id;
        fs.appendFileSync(`./${collectionName}.json`, 
            ((offset === 0 && count === 0) ? '[\n' : ',') +
            JSON.stringify(item, null, 2) + '\n', 
        'utf8');
        data.push(item);
        count++;
      });
    })
    .catch(err => {
        error = err;
    });
    return {data, error };        
}


