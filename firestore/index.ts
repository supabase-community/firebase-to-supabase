import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { keys as supabasekeys } from './supabase-keys';
import { getFirestoreInstance } from './utils';

const supabase: SupabaseClient = createClient(supabasekeys.SUPABASE_URL, supabasekeys.SUPABASE_KEY);

const db = getFirestoreInstance();

const collections = [];

async function loadAllCollections() {
    await db.listCollections()
    .then(snapshot=>{
        snapshot.forEach(snaps => {
            // console.log(snaps["_queryOptions"].collectionId); // LIST OF ALL COLLECTIONS
            collections.push(snaps["_queryOptions"].collectionId);
        })
    })
    .catch(error => console.error(error));    
}
loadAllCollections();

async function main() {
    await loadAllCollections();
    console.log('collections', collections);
    const docs = await getAllDocuments(collections[0]);
    console.log('docs', docs);
}
main();

async function getAllDocuments(collectionName: string) {
    const docs = [];
    await db.collection(collectionName).get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            // console.log(doc.id, '=>', doc.data());
            const data = doc.data();
            if (!data.id) data.id = doc.id;
            else data.firestoreId = doc.id;
            docs.push(data);
        });
    })
    .catch(error => console.error(error));
    return docs;
}

