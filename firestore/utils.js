"use strict";
exports.__esModule = true;
exports.getFirestoreInstance = exports.removeEmptyFields = void 0;
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-service.json");
// console.log('databaseURL', `https://${serviceAccount.project_id}.firebaseio.com`);
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://".concat(serviceAccount.project_id, ".firebaseio.com") // "https://PROJECTID.firebaseio.com"
    });
}
catch (e) { }
var db = admin.firestore();
function getFirestoreInstance() {
    return db;
}
exports.getFirestoreInstance = getFirestoreInstance;
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
exports.removeEmptyFields = removeEmptyFields;
