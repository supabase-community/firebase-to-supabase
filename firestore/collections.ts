import { getFirestoreInstance } from './utils';
// import * as admin from "firebase-admin";
// import { DataSnapshot, Query } from '@firebase/database-types';
// import * as fs from 'fs';

const db = getFirestoreInstance();

async function main() {
    await db.listCollections()
        .then(snapshot => {
            snapshot.forEach(snaps => {
                // console.log(snaps["_queryOptions"].collectionId); // LIST OF ALL COLLECTIONS
                console.log(snaps["_queryOptions"].collectionId);
            })
        })
        .catch(err => console.log('ERROR', err));
}
main();




