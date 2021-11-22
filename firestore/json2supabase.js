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
var fs = require("fs");
var pg_1 = require("pg");
var StreamArray = require("stream-json/streamers/StreamArray");
var args = process.argv.slice(2);
var filename;
var tableName;
var fields;
var client;
if (args.length < 1) {
    console.log('Usage: node json2supabase.js <path_to_json_file> [<primary_key_strategy>] [<primary_key_name>]');
    console.log('  path_to_json_file: full local path and filename of .json input file');
    console.log('  primary_key_strategy (optional):');
    console.log('    none (no primary key is added');
    console.log('    serial (id SERIAL PRIMARY KEY) (autoincrementing 2-byte integer)');
    console.log('    smallserial (id SMALLSERIAL PRIMARY KEY) (autoincrementing 4-byte integer)');
    console.log('    bigserial (id BIGSERIAL PRIMARY KEY) (autoincrementing 8-byte integer)');
    console.log('    uuid (id UUID PRIMARY KEY DEFAULT uuid_generate_v4()) (randomly generated uuid)');
    console.log('    firestore_id (id TEXT PRIMARY KEY) (uses existing firestore_id random text as key)');
    console.log('  primary_key_name (optional): name of primary key (defaults to "id")');
    process.exit(1);
}
else {
    filename = args[0];
}
var primary_key_strategy = args[1] || 'none';
var primary_key_name = args[2] || 'id';
var pgCreds;
try {
    pgCreds = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
    if (typeof pgCreds.user === 'string' &&
        typeof pgCreds.password === 'string' &&
        typeof pgCreds.host === 'string' &&
        typeof pgCreds.port === 'number' &&
        typeof pgCreds.database === 'string') { }
    else {
        console.log('supabase-service.json must contain the following fields:');
        console.log('   user: string');
        console.log('   password: string');
        console.log('   host: string');
        console.log('   port: number');
        console.log('   database: string');
        process.exit(1);
    }
}
catch (err) {
    console.log('error reading supabase-service.json', err);
    process.exit(1);
}
function main(filename) {
    return __awaiter(this, void 0, void 0, function () {
        var tableCreationResult, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("analyzing fields in " + filename);
                    return [4 /*yield*/, getFields(filename)];
                case 1:
                    fields = _a.sent();
                    // console.log('fields:', JSON.stringify(fields, null, 2));
                    client = new pg_1.Client({
                        user: pgCreds.user,
                        host: pgCreds.host,
                        database: pgCreds.database,
                        password: pgCreds.password,
                        port: pgCreds.port
                    });
                    // parse table name from filename / path
                    tableName = filename.replace(/\\/g, '/').split('/').pop().split('.')[0].replace('.json', '');
                    console.log("creating destination table for " + filename);
                    return [4 /*yield*/, createTable(tableName, fields)];
                case 2:
                    tableCreationResult = _a.sent();
                    console.log("loading data for " + filename);
                    return [4 /*yield*/, loadData()];
                case 3:
                    result = _a.sent();
                    console.log("done processing " + filename);
                    quit();
                    return [2 /*return*/];
            }
        });
    });
}
function quit() {
    client.end();
    process.exit(1);
}
function createTable(tableName, fields) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    client.connect();
                    client.query("select column_name, data_type, character_maximum_length, column_default, is_nullable\n        from INFORMATION_SCHEMA.COLUMNS where table_schema = 'public' and table_name = '" + tableName + "'", function (err, res) {
                        var _a;
                        if (err) {
                            quit();
                            reject(err);
                        }
                        else {
                            // console.log(JSON.stringify(res.rows, null, 2));
                            if (res.rows.length > 0) {
                                var _loop_1 = function (attr) {
                                    // get data_type from rows
                                    var dataType = (_a = res.rows.find(function (row) { return row.column_name === attr; })) === null || _a === void 0 ? void 0 : _a.data_type;
                                    if (!dataType) {
                                        console.log("field not found in " + tableName + " table: " + attr);
                                        quit();
                                        reject("field not found in " + tableName + " table: " + attr);
                                    }
                                    // check to see if data_type is correct
                                    if (attr === primary_key_name ? getKeyType(primary_key_strategy) === dataType : dataType !== fields[attr]) {
                                        console.log("data type mismatch for field " + attr + ": " + dataType + ", " + fields[attr]);
                                        quit();
                                        reject("data type mismatch for field " + attr + ": " + dataType + ", " + fields[attr]);
                                    }
                                };
                                for (var attr in fields) {
                                    _loop_1(attr);
                                }
                                resolve('table exists');
                            }
                            else {
                                var sql_1 = "create table \"" + tableName + "\" (";
                                if (primary_key_strategy !== 'none') {
                                    sql_1 += createPrimaryKey(primary_key_strategy) + ",";
                                }
                                for (var attr in fields) {
                                    sql_1 += "\"" + attr + "\" " + fields[attr] + ", ";
                                }
                                sql_1 = sql_1.slice(0, -2);
                                sql_1 += ')';
                                client.query(sql_1, function (err, res) {
                                    if (err) {
                                        if (err.toString().endsWith('specified more than once')) {
                                            console.log(err.toString() + ': try specifying a different <primary_key_name>');
                                            quit();
                                        }
                                        else {
                                            console.log('createTable error:', err);
                                            console.log('sql was: ' + sql_1);
                                        }
                                        quit();
                                        reject(err);
                                    }
                                    else {
                                        // console.log('table created', JSON.stringify(res, null, 2));
                                        resolve('table created');
                                    }
                                });
                            }
                        }
                    });
                })];
        });
    });
}
function getFields(filename) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var jsonStream = StreamArray.withParser();
                    var fields = {};
                    //internal Node readable stream option, pipe to stream-json to convert it for us
                    var readStream = fs.createReadStream(filename).pipe(jsonStream.input);
                    //You'll get json objects here
                    //Key is the array-index here
                    jsonStream.on('data', function (_a) {
                        var key = _a.key, value = _a.value;
                        for (var attr in value) {
                            if (!fields[attr]) {
                                fields[attr] = typeof value[attr];
                            }
                            if ((fields[attr] !== typeof value[attr]) && fields[attr] !== 'object' && value[attr] !== null) {
                                console.log("multiple field types found for field " + attr + ": " + fields[attr] + ", " + typeof value[attr]);
                                console.log("casting " + attr + " to type object (JSONB)");
                                fields[attr] = 'object';
                                // quit();
                                // reject(`multiple field types found for field ${attr}: ${fields[attr]}, ${typeof value[attr]}`);
                                // process.exit(1);
                            }
                        }
                    });
                    jsonStream.on('end', function () {
                        for (var attr in fields) {
                            fields[attr] = jsToSqlType(fields[attr]);
                        }
                        readStream.destroy();
                        jsonStream.destroy();
                        resolve(fields);
                    });
                })];
        });
    });
}
function loadData() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var insertRows = [];
                    var jsonStream = StreamArray.withParser();
                    //internal Node readable stream option, pipe to stream-json to convert it for us
                    fs.createReadStream(filename).pipe(jsonStream.input);
                    //You'll get json objects here
                    //Key is the array-index here
                    jsonStream.on('data', function (_a) {
                        var key = _a.key, value = _a.value;
                        return __awaiter(_this, void 0, void 0, function () {
                            var sql, attr, val, result;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        sql = "(";
                                        for (attr in fields) {
                                            val = value[attr];
                                            if (typeof val === 'object' || fields[attr] === 'jsonb')
                                                val = JSON.stringify(val);
                                            if (typeof val === 'undefined') {
                                                sql += (sql.length > 1 ? ',' : '') + "null";
                                            }
                                            else if (fields[attr] !== 'numeric' && fields[attr] !== 'boolean') {
                                                sql += (sql.length > 1 ? ',' : '') + "'" + val.replace(/'/g, "''") + "'";
                                            }
                                            else {
                                                sql += "" + (sql.length > 1 ? ',' : '') + value[attr];
                                            }
                                        }
                                        if (primary_key_strategy === 'firestore_id') {
                                            sql += ",'" + value.firestore_id + "'";
                                        }
                                        sql += ')';
                                        insertRows.push(sql);
                                        if (!(insertRows.length >= 100)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, runSQL(makeInsertStatement(fields, insertRows))];
                                    case 1:
                                        result = _b.sent();
                                        insertRows = [];
                                        _b.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        });
                    });
                    jsonStream.on('error', function (err) {
                        console.log('loadData error', err);
                    });
                    jsonStream.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, runSQL(makeInsertStatement(fields, insertRows))];
                                case 1:
                                    result = _a.sent();
                                    resolve('DONE');
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                })];
        });
    });
}
function makeInsertStatement(fields, insertRows) {
    var fieldList = '';
    for (var attr in fields) {
        fieldList += (fieldList.length > 0 ? ',' : '') + "\"" + attr + "\"";
    }
    if (primary_key_strategy === 'firestore_id') {
        fieldList += "," + primary_key_name;
    }
    var sql = "insert into \"" + tableName + "\" (" + fieldList + ") values " + insertRows.join(',');
    fs.writeFileSync('temp.sql', sql, 'utf8');
    return sql;
}
function runSQL(sql) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // fs.writeFileSync(`temp.sql`, sql, 'utf-8');
                    client.query(sql, function (err, res) {
                        if (err) {
                            console.log('runSQL error:', err);
                            console.log('sql was: ' + sql);
                            quit();
                            reject(err);
                        }
                        else {
                            resolve(res);
                        }
                    });
                })];
        });
    });
}
function jsToSqlType(type) {
    switch (type) {
        case 'string':
            return 'text';
        case 'number':
            return 'numeric';
        case 'boolean':
            return 'boolean';
        case 'object':
            return 'jsonb';
        case 'array':
            return 'jsonb';
        default:
            return 'text';
    }
}
function getKeyType(primary_key_strategy) {
    switch (primary_key_strategy) {
        case 'none':
            return '';
        case 'serial':
            return 'integer';
        case 'smallserial':
            return 'smallint';
        case 'bigserial':
            return 'bigint';
        case 'uuid':
            return 'uuid';
        case 'firestore_id':
            return 'text';
        default:
            return '';
    }
}
function createPrimaryKey(primary_key_strategy) {
    switch (primary_key_strategy) {
        case 'none':
            return '';
        case 'serial':
            return "\"" + primary_key_name + "\" SERIAL PRIMARY KEY";
        case 'smallserial':
            return "\"" + primary_key_name + "\" SMALLSERIAL PRIMARY KEY";
        case 'bigserial':
            return "\"" + primary_key_name + "\" BIGSERIAL PRIMARY KEY";
        case 'uuid':
            return "\"" + primary_key_name + "\" UUID PRIMARY KEY DEFAULT uuid_generate_v4()";
        case 'firestore_id':
            return "\"" + primary_key_name + "\" TEXT PRIMARY KEY";
        default:
            return '';
    }
}
main(filename);
