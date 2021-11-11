import { getFirestoreInstance } from './utils';
import * as fs from 'fs';

const args = process.argv.slice(2);
let db;

if (args.length < 1) {
    console.log('Usage: firestore2json.ts <collectionName>');
    process.exit(1);
} else {
    db = getFirestoreInstance();
    main(args[0]);
}

async function main(collectionName: string) {

    getAll(collectionName, 0, 20);
    
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
        if (!item.id) item.id = doc.id;
        else item.firestoreId = doc.id;        
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

