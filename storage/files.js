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
var fs_1 = require("fs");
var utils_1 = require("./utils");
var args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node files.js <prefix> <mode> [<batchSize>] [<limit>]');
    console.log('       <prefix>: the prefix of the files to download');
    console.log('                 to process the root bucket use prefix ""');
    console.log('       <mode>: "single" to download/upload one file at a time');
    console.log('               "batch" to download/upload a batch of files at a time');
    console.log('               "download" to download files only');
    console.log('               "upload" to upload files only');
    console.log('               "count" to get a matching file count');
    console.log('               "list" to get a matching list of file names');
    console.log('       <batchSize>: (optional), default is 100');
    console.log('       <limit>: (optional), stop after processing this many files');
    process.exit(1);
}
var prefix = args[0];
var mode = args[1] || '';
if (['single', 'batch', 'download', 'upload', 'count', 'list'].indexOf(mode) < 0) {
    console.error('Invalid mode: ', mode);
    console.log('mode must be one of: single, batch, download, upload, count, list');
    process.exit(1);
}
var batchSize;
var limit;
var count = 0;
// GetFilesOptions: 
// https://googleapis.dev/nodejs/storage/latest/global.html#GetFilesOptions
//
try {
    batchSize = parseInt(args[2] || '100');
}
catch (err) {
    console.error('error setting batchSize:');
    console.error(err);
    process.exit(1);
}
try {
    limit = parseInt(args[3] || '0');
}
catch (err) {
    console.error('error setting limit:');
    console.error(err);
    process.exit(1);
}
try {
    if (!(0, fs_1.existsSync)('./tmp')) {
        (0, fs_1.mkdirSync)('./tmp');
    }
}
catch (err) {
    console.error('error creating ./tmp folder:');
    console.error(err);
    process.exit(1);
}
var storage = (0, utils_1.getStorageInstance)();
function getBatch(query) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, files, queryForNextPage, c;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, storage.bucket((0, utils_1.getBucketName)())
                        .getFiles(query)];
                case 1:
                    _a = _b.sent(), files = _a[0], queryForNextPage = _a[1];
                    c = 0;
                    files.forEach(function (file) {
                        return __awaiter(this, void 0, void 0, function () {
                            var err;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        switch (mode) {
                                            case 'single':
                                                break;
                                            case 'batch':
                                                break;
                                            case 'download':
                                                break;
                                            case 'upload':
                                                break;
                                            case 'count':
                                                count++;
                                                break;
                                            case 'list':
                                                break;
                                            default:
                                                console.log('unknown mode: ', mode);
                                                process.exit(1);
                                        }
                                        return [4 /*yield*/, storage.bucket((0, utils_1.getBucketName)())
                                                .file(file.name).download({ destination: "./tmp/".concat(encodeURIComponent(file.name)) })];
                                    case 1:
                                        err = (_a.sent())[0];
                                        if (err) {
                                            console.error('Error downloading file', err);
                                        }
                                        c++;
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // console.log('***** ', c, ' files in batch')
                    if (queryForNextPage) {
                        //getBatch(queryForNextPage);
                    }
                    else {
                        switch (mode) {
                            case 'single':
                                break;
                            case 'batch':
                                break;
                            case 'download':
                                break;
                            case 'upload':
                                break;
                            case 'count':
                                console.log('count: ', count);
                                process.exit(0);
                                break;
                            case 'list':
                                break;
                            default:
                                console.log('unknown mode: ', mode);
                                process.exit(1);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var startQuery;
        return __generator(this, function (_a) {
            startQuery = {
                prefix: prefix,
                autoPaginate: false,
                maxResults: batchSize
            };
            getBatch(startQuery);
            return [2 /*return*/];
        });
    });
}
main();
