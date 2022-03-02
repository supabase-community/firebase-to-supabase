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
var utils_1 = require("./utils");
var fs = require("fs");
var args = process.argv.slice(2);
var processDocument;
if (fs.existsSync("./".concat(args[0], "_processDocument.js"))) {
    // read file to string
    processDocument = require("./".concat(args[0], "_processDocument.js"));
    // processDocument = fs.readFileSync(`./${args[0]}_processDocument.js`, 'utf8');
}
var db;
var recordCounters = {};
var limit = 0;
if (args.length < 1) {
    console.log('Usage: firestore2json.ts <collectionName> [<batchSize>] [<limit>]');
    process.exit(1);
}
else {
    db = (0, utils_1.getFirestoreInstance)();
    main(args[0], args[1] || '1000', args[2] || '0');
}
function main(collectionName, batchSize, limit) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // if (fs.existsSync(`./${collectionName}.json`)) {
                //     console.log(`${collectionName}.json already exists, aborting...`);
                //     process.exit(1);
                // } else {
                return [4 /*yield*/, getAll(collectionName, 0, parseInt(batchSize), parseInt(limit))];
                case 1:
                    // if (fs.existsSync(`./${collectionName}.json`)) {
                    //     console.log(`${collectionName}.json already exists, aborting...`);
                    //     process.exit(1);
                    // } else {
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getAll(collectionName, offset, batchSize, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, key;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getBatch(collectionName, offset, batchSize, limit)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (!(data.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getAll(collectionName, offset + data.length, batchSize, limit)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    (0, utils_1.cleanUp)(recordCounters);
                    for (key in recordCounters) {
                        console.log("".concat(recordCounters[key], " records written to ").concat(key, ".json"));
                    }
                    _b.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getBatch(collectionName, offset, batchSize, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = [];
                    error = null;
                    if (recordCounters[collectionName] >= limit) {
                        return [2 /*return*/, { data: data, error: error }];
                    }
                    if (typeof recordCounters[collectionName] === 'undefined') {
                        recordCounters[collectionName] = 0;
                    }
                    if (limit > 0) {
                        batchSize = Math.min(batchSize, limit - recordCounters[collectionName]);
                    }
                    return [4 /*yield*/, db.collection(collectionName)
                            .limit(batchSize)
                            .offset(offset)
                            .get()
                            .then(function (snapshot) {
                            snapshot.forEach(function (fsdoc) {
                                var doc = fsdoc.data();
                                if (!doc.firestore_id)
                                    doc.firestore_id = fsdoc.id;
                                else if (!doc.firestoreid)
                                    doc.firestoreid = fsdoc.id;
                                else if (!doc.original_id)
                                    doc.original_id = fsdoc.id;
                                else if (!doc.originalid)
                                    doc.originalid = fsdoc.id;
                                console.log('processDocument', typeof processDocument);
                                if (processDocument) {
                                    doc = processDocument(collectionName, doc, recordCounters, utils_1.writeRecord);
                                }
                                (0, utils_1.writeRecord)(collectionName, doc, recordCounters);
                                data.push(doc);
                            });
                        })["catch"](function (err) {
                            error = err;
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { data: data, error: error }];
            }
        });
    });
}
