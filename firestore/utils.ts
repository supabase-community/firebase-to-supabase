import * as admin from "firebase-admin";
import * as fs from 'fs';

const serviceAccount = require("./firebase-service.json");

// console.log('databaseURL', `https://${serviceAccount.project_id}.firebaseio.com`);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // "https://PROJECTID.firebaseio.com"
  });
} catch (e) {}

const db = admin.firestore();

function getFirestoreInstance(): admin.firestore.Firestore {
  return db;
}

function removeEmptyFields(obj: any) {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === "object") {
      removeEmptyFields(obj[key]);
    } else if (obj[key] === null || obj[key] === "" || obj[key] === " ") {
      delete obj[key];
    }
  });
}

const startFile = (name: string, recordCounters: any) =>{
  fs.writeFileSync(`./${name}.json`, 
      '[\n', 
  'utf8');
  recordCounters[name] = 0;
} 
const endFile = (name: string) => {
  fs.appendFileSync(`./${name}.json`, 
  '\n]', 
  'utf8');    
}
const writeRecord = (name: string, doc: any, recordCounters: any) => {
  fs.appendFileSync(`./${name}.json`, 
      (recordCounters[name] > 0 ? ',\n' : '') + JSON.stringify(doc, null, 2), 
  'utf8');
  recordCounters[name]++;
}


export { removeEmptyFields, getFirestoreInstance, startFile, endFile, writeRecord };
