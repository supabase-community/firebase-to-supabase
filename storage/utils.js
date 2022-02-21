"use strict";
exports.__esModule = true;
exports.getStorageInstance = exports.getBucketName = void 0;
//import { getStorage, listAll, ref } from "@firebase/storage";
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-service.json");
// console.log('databaseURL', `https://${serviceAccount.project_id}.firebaseio.com`);
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "".concat(serviceAccount.project_id, ".appspot.com")
    });
}
catch (e) { }
var storage = admin.storage();
function getStorageInstance() {
    return storage;
}
exports.getStorageInstance = getStorageInstance;
function getBucketName() {
    return "".concat(serviceAccount.project_id, ".appspot.com");
}
exports.getBucketName = getBucketName;
function removeEmptyFields(obj) {
    Object.keys(obj).forEach(function (key) {
        if (obj[key] && typeof obj[key] === "object") {
            removeEmptyFields(obj[key]);
        }
        else if (obj[key] === null || obj[key] === "" || obj[key] === " ") {
            delete obj[key];
        }
    });
}
