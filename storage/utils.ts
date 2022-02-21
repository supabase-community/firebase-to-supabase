import * as admin from "firebase-admin";

const serviceAccount = require("./firebase-service.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
} catch (e) {}

const storage = admin.storage();

function getStorageInstance(): admin.storage.Storage {
  return storage;
}
function getBucketName(): string {
  return `${serviceAccount.project_id}.appspot.com`;
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



export { getBucketName, getStorageInstance };
