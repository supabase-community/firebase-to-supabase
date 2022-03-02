"use strict";
exports.__esModule = true;
exports.writeRecord = exports.cleanUp = exports.getFirestoreInstance = exports.removeEmptyFields = void 0;
var admin = require("firebase-admin");
var fs = require("fs");
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
var cleanUp = function (recordCounters) {
    for (var key in recordCounters) {
        fs.appendFileSync("./".concat(key, ".json"), '\n]', 'utf8');
    }
};
exports.cleanUp = cleanUp;
var writeRecord = function (name, doc, recordCounters) {
    if (!recordCounters[name] || recordCounters[name] === 0) {
        fs.writeFileSync("./".concat(name, ".json"), '[\n', 'utf8');
        recordCounters[name] = 0;
    }
    fs.appendFileSync("./".concat(name, ".json"), (recordCounters[name] > 0 ? ',\n' : '') + JSON.stringify(doc, null, 2), 'utf8');
    recordCounters[name]++;
};
exports.writeRecord = writeRecord;
