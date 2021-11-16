//import { getFirestoreInstance } from './utils';
import * as fs from 'fs';
import * as admin from "firebase-admin";
const serviceAccount = require("./firebase-service.json");

// console.log('databaseURL', `https://${serviceAccount.project_id}.firebaseio.com`);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // "https://PROJECTID.firebaseio.com"
  });
} catch (e) {}

const args = process.argv.slice(2);
//let db;

if (args.length < 0) {
    console.log('Usage: firestoreusers2json.ts');
    process.exit(1);
} else {
    //db = getFirestoreInstance();
    //main(args[0], args[1] || '1000');
    main();
}

//async function main(collectionName: string, batchSize: string) {
async function main() {
    fs.writeFileSync('users.json', '[', 'utf-8');
    listUsers();
    // getAll(collectionName, 0, parseInt(batchSize));
    
}

let count = 0;
async function listUsers(nextPageToken?: string) {
        admin.auth().listUsers(100, nextPageToken)
        .then((usersFound: admin.auth.ListUsersResult) => {
            const users: admin.auth.UserRecord[] = usersFound.users;
            users.forEach((user: admin.auth.UserRecord) => {
                fs.appendFileSync('users.json', (count > 0 ? ',' : '') + JSON.stringify(user, null, 2), 'utf-8');
                count++;
            });
            if (usersFound.pageToken) {
                listUsers(usersFound.pageToken);
            } else {
                fs.appendFileSync('users.json', ']\n', 'utf-8');
            }
        }).catch((err) => {
            console.log('ERROR in listUsers', JSON.stringify(err));
        });
}


