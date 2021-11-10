import * as admin from "firebase-admin";

const serviceAccount = require("./firebase-service.json");

console.log('databaseURL', `https://${serviceAccount.project_id}.firebaseio.com`);

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



export { removeEmptyFields, getFirestoreInstance };
