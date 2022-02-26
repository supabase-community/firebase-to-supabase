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
var supabase_js_1 = require("@supabase/supabase-js");
var fs_1 = require("fs");
var supabase_keys_1 = require("./supabase-keys");
var supabase = (0, supabase_js_1.createClient)(supabase_keys_1.keys.SUPABASE_URL, supabase_keys_1.keys.SUPABASE_KEY);
var args = process.argv.slice(2);
if (args.length < 3) {
    // console.log('Usage: node upload.js <prefix> <folder> <bucket> [<batchSize>] [<limit>] [<token>]');
    console.log('Usage: node upload.js <prefix> <folder> <bucket>');
    console.log('       <prefix>: the prefix of the files to download');
    console.log('                 to process all files use prefix ""');
    console.log('       <folder>: name of subfolder of files to upload, default is "downloads"');
    console.log('       <bucket>: name of bucket to upload to');
    // console.log('       <batchSize>: (optional), default is 100');
    // console.log('       <limit>: (optional), stop after processing this many files');
    // console.log('       <token>: (optional), begin processing at this pageToken');
    process.exit(1);
}
var prefix = args[0] || '';
var folder = args[1] || 'downloads';
var bucket = args[2] || '';
var files = [];
var totalCount = 0;
var count = 0;
// get list of files in folder
try {
    console.log('reading files from:', "./".concat(folder));
    files = (0, fs_1.readdirSync)("./".concat(folder)).filter(function (file) { return file.startsWith(prefix); });
    totalCount = files.length;
    console.log('found', files.length, 'files');
}
catch (err) {
    console.error('error reading ./downloads folder:');
    console.error(err);
    process.exit(1);
}
var createBucket = function (bucket) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, data, error;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log('...creating bucket:', bucket);
                return [4 /*yield*/, supabase
                        .storage
                        .createBucket(bucket, { public: false })];
            case 1:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    if (error.message === "duplicate key value violates unique constraint \"buckets_pkey\"") {
                        // bucket already exists
                        console.log("bucket ".concat(bucket, " already exists"));
                    }
                    else {
                        console.error('error creating bucket:', error);
                        process.exit(1);
                    }
                }
                else {
                    return [2 /*return*/, data];
                }
                return [2 /*return*/];
        }
    });
}); };
var processBatch = function (files) { return __awaiter(void 0, void 0, void 0, function () {
    var file, contents, _a, data, error;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(files.length === 0)) return [3 /*break*/, 1];
                console.log('done');
                return [2 /*return*/];
            case 1:
                file = files.shift();
                count++;
                console.log("uploading ".concat(count, " of ").concat(totalCount, " to bucket ").concat(bucket, ": ").concat(file));
                contents = (0, fs_1.readFileSync)("./".concat(folder, "/").concat(file));
                return [4 /*yield*/, supabase
                        .storage
                        .from(bucket)
                        .upload("".concat(decodeURIComponent(file)), contents, {
                        cacheControl: '3600',
                        upsert: true
                    })];
            case 2:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    console.error('error uploading file:', error);
                    process.exit(1);
                }
                else {
                    processBatch(files);
                }
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var mainLoop = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, createBucket(bucket)];
            case 1:
                result = _a.sent();
                console.log('...created bucket:', result);
                processBatch(files);
                return [2 /*return*/];
        }
    });
}); };
mainLoop();
