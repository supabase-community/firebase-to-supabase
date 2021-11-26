//import { getFirestoreInstance } from './utils';
import * as fs from 'fs';
import * as admin from "firebase-admin";
const serviceAccount = require("./firebase-service.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // "https://PROJECTID.firebaseio.com"
  });
} catch (e) {}

const args = process.argv.slice(2);
//let db;

if (args.length < 0) {
    console.log('Usage: node firestoreusers2json.js [<filename.json>] [<batch_size>]');
    console.log('   <filename.json>: (optional) output filename (defaults to ./users.json');
    console.log('   <batch_size>: (optional) number of users to fetch at a time (defaults to 100)');
    process.exit(1);
} else {
    main();
}

const filename = args[0] || './users.json';
const batch_size = args[1] || '100';

async function main() {
    fs.writeFileSync(filename, '[', 'utf-8');
    listUsers();    
}

let count = 0;
async function listUsers(nextPageToken?: string) {
        admin.auth().listUsers(parseInt(batch_size), nextPageToken)
        .then((usersFound: admin.auth.ListUsersResult) => {
            const users: admin.auth.UserRecord[] = usersFound.users;
            users.forEach((user: admin.auth.UserRecord) => {
                fs.appendFileSync(filename, (count > 0 ? ',' : '') + JSON.stringify(user, null, 2), 'utf-8');
                count++;
            });
            if (usersFound.pageToken) {
                listUsers(usersFound.pageToken);
            } else {
                fs.appendFileSync(filename, ']\n', 'utf-8');
            }
        }).catch((err) => {
            console.log('ERROR in listUsers', JSON.stringify(err));
        });
}


