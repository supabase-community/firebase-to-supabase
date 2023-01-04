"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
//import { getFirestoreInstance } from './utils';
var fs = require("fs");
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-service.json");
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://".concat(serviceAccount.project_id, ".firebaseio.com") // "https://PROJECTID.firebaseio.com"
    });
}
catch (e) { }
var args = process.argv.slice(2);
if (args.length < 0) {
    console.log('Usage: node firestoreusers2json.js [<filename.json>] [<batch_size>]');
    console.log('   <filename.json>: (optional) output filename (defaults to ./users.json');
    console.log('   <batch_size>: (optional) number of users to fetch at a time (defaults to 100)');
    process.exit(1);
}
else {
    main();
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var filename, batchSizeInput, batchSize;
        return __generator(this, function (_a) {
            filename = args[0] || "./users.json";
            batchSizeInput = args[1] || "100";
            batchSize = parseInt(batchSizeInput);
            fs.writeFileSync(filename, "[", "utf-8");
            listUsers(filename, batchSize);
            return [2 /*return*/];
        });
    });
}
function listUsers(filename, batchSize, nextPageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var count;
        return __generator(this, function (_a) {
            count = 0;
            admin.auth().listUsers(batchSize, nextPageToken)
                .then(function (usersFound) {
                var users = usersFound.users;
                users.forEach(function (user) {
                    fs.appendFileSync(filename, (count > 0 ? ',' : '') + JSON.stringify(user, null, 2), 'utf-8');
                    count++;
                });
                if (usersFound.pageToken) {
                    fs.appendFileSync(filename, ',', 'utf-8');
                    listUsers(filename, batchSize, usersFound.pageToken);
                }
                else {
                    fs.appendFileSync(filename, ']\n', 'utf-8');
                }
            })["catch"](function (err) {
                console.log('ERROR in listUsers', JSON.stringify(err));
            });
            return [2 /*return*/];
        });
    });
}
