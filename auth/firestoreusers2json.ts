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

if (args.length < 0) {
    console.log('Usage: node firestoreusers2json.js [<filename.json>] [<batch_size>]');
    console.log('   <filename.json>: (optional) output filename (defaults to ./users.json');
    console.log('   <batch_size>: (optional) number of users to fetch at a time (defaults to 100)');
    process.exit(1);
} else {
    main();
}

async function main() {
    const filename = args[0] || "./users.json";
    const batchSizeInput = args[1] || "100";
    const batchSize = parseInt(batchSizeInput);
    fs.writeFileSync(filename, "[", "utf-8");
    listUsers(filename, batchSize);
}


async function listUsers(
  filename: string,
  batchSize: number,
  nextPageToken?: string
) {
    let count = 0;
    admin.auth().listUsers(batchSize, nextPageToken)
    .then((usersFound: admin.auth.ListUsersResult) => {
        const users: admin.auth.UserRecord[] = usersFound.users;
        users.forEach((user: admin.auth.UserRecord) => {
            fs.appendFileSync(filename, (count > 0 ? ',' : '') + JSON.stringify(user, null, 2), 'utf-8');
            count++;
        });
        if (usersFound.pageToken) {
            fs.appendFileSync(filename, ',', 'utf-8');
            listUsers(filename, batchSize, usersFound.pageToken);
        } else {
            fs.appendFileSync(filename, ']\n', 'utf-8');
        }
    }).catch((err) => {
        console.log('ERROR in listUsers', JSON.stringify(err));
    });
}
