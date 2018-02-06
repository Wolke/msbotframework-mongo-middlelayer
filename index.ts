var Consts = require('./Consts');
var zlib = require('zlib');
var Db = require('mongodb').Db;
var replaceDot_Atrate = require("./replaceDot");

var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var connectionInstance: any;
var async = require('async');
import { IBotStorage } from "botbuilder"

interface Conf {
    DatabaseName: string,
    mongoIp: string,
    mongoPort: string,
    collectionName: string,
    username?: string,
    password?: string

}

const mongoDbConnection = (conf: Conf, callback: any) => {
    if (connectionInstance) {
        callback(null, connectionInstance);
        return;
    }
    var db = new Db(conf.DatabaseName, new Server(conf.mongoIp, conf.mongoPort, { auto_reconnect: true }));
    db.open(function (error: any, databaseConnection: any) {
        //if (error) throw new Error(error);
        if (error) { callback(error, null) }
        else {
            console.log("database connection successfully in connection class")
            connectionInstance = databaseConnection;
            if (conf.username && conf.password) {
                db.authenticate(conf.username, conf.password, null, function (error: Error, result: any) {
                    console.log("result", result)
                    if (result) {
                        callback(null, databaseConnection);
                    } else {
                        throw error
                    }
                })
            } else {
                callback(null, databaseConnection);
            }
        }
    });
}

function connectDb(conf: Conf) {
    return new Promise(function (resolve, reject) {
        mongoDbConnection(conf, (err: Error, database: any) => {
            if (err) {
                throw err;
            }
            // console.log("mongoDbConnection", mongoDbConnection)
            resolve(database)
        })
    });
}

class IStorageClient {
    conf: Conf;
    client: any;
    database: any;
    collection: any

    // options: any
    constructor(conf: Conf) {
        this.conf = conf;
        this.client = require('mongodb').MongoClient;
    } 

    async retrieve(partitionKey: string, rowKey: string, callback: any) {
        if (this.database === undefined) {
            this.database = await connectDb(this.conf);
            this.collection = this.database.collection(this.conf.collectionName);
        }
        var id = partitionKey + ',' + rowKey;

        if (rowKey !== "userData") {
            var query = { "$and": [{ "userid": id }] }
            // console.log("=========retrieve===========", "begin","query",query)

            var iterator = this.database.collection(this.conf.collectionName).find(query);
            iterator.toArray(function (error: Error, result: any, responseHeaders: any) {
                if (error) {
                    console.log("=========retrieve===========", "query", query, "Error", error)
                    callback(error, null, null);
                }
                else if (result.length == 0) {
                    console.log("=========retrieve===========", "query", query, 0)

                    callback(null, null, null);
                }
                else {
                    console.log("=========retrieve===========", "query", query, "result", result)

                    var document_1 = result[0];
                    var finaldoc = replaceDot_Atrate.substituteKeyDeep(document_1, /\@/g, '.');
                    finaldoc["id"] = id
                    callback(null, finaldoc, null);
                }
            });
        } else {
            var query = { "$and": [{ "userid": partitionKey }] }
            var iterator = this.database.collection(this.conf.collectionName).find(query);
            iterator.toArray(function (error: Error, result: any, responseHeaders: any) {
                if (error) {
                    callback(error, null, null);
                }
                else if (result.length == 0) {
                    callback(null, null, null);
                }
                else {
                    var document_1 = result[0];
                    callback(null, document_1, null);
                }
            });
        }
    }
    async insertOrReplace(partitionKey: string, rowKey: string, entity: string, isCompressed: boolean, callback: any) {
        console.log("=========insertOrReplace===========", "begin",partitionKey,rowKey,entity,isCompressed)
        if (this.database === undefined) {
            this.database = await connectDb(this.conf);
            this.collection = this.database.collection(this.conf.collectionName);
        }

        var id = partitionKey + ',' + rowKey
        var docDbEntity = { id: partitionKey + ',' + rowKey, data: entity, isCompressed: isCompressed };
        if (rowKey !== "userData") {
            var newEntitiy = replaceDot_Atrate.substituteKeyDeep(entity, /\./g, '@');
            var conditions1 = {
                'userid': id
            };
            var updateobj1 = {
                "$set": { "data": newEntitiy, "isCompressed": false }
            };
            this.database.collection(this.conf.collectionName).update(conditions1, updateobj1, { upsert: true }, function (err: Error, res: any) {
                console.log("=========insertOrReplace===========", "err", err, "conditions1", conditions1, "entity", entity);
                callback(err, null, "");
            });
        } else {
            var conditions = {
                'userid': partitionKey
            };
            var update = {
                "$set": { "data": entity }
            }
            this.database.collection(this.conf.collectionName).update(conditions, update, { upsert: true }, function (err: Error, res: any) {
                console.log("=========insertOrReplace===========", "err", err, "conditions", conditions, "entity", entity);
                callback(err, null, "");
            })
        }
    }
}

export class MongoDbStorage implements IBotStorage {
    storageClient: any;
    conf: Conf;

    constructor(conf: Conf
        // , options: {
        // gzipData: boolean
        // }
    ) {
        console.log("=========initializeStorageClient===========")
        this.conf = conf;
        this.storageClient = new IStorageClient(conf);

    }
    getData(context: any, callback: any) {
        console.log("=========getData===========")
        if (this.storageClient === null) {
            this.storageClient = new IStorageClient(this.conf);
        }
        // return;
        var storageClient = this.storageClient;
        var list = [];
        if (context.userId) {
            if (context.persistUserData) {
                list.push({
                    partitionKey: context.userId,
                    rowKey: Consts.Fields.UserDataField,
                    field: Consts.Fields.UserDataField
                });
            }
            if (context.conversationId) {
                list.push({
                    partitionKey: context.conversationId,
                    rowKey: context.userId,
                    field: Consts.Fields.PrivateConversationDataField
                });
            }
        }
        if (context.persistConversationData && context.conversationId) {
            list.push({
                partitionKey: context.conversationId,
                rowKey: Consts.Fields.ConversationDataField,
                field: Consts.Fields.ConversationDataField
            });
        }
        var data: any = {};
        // console.log("list",list)
        async.each(list, function (entry: any, cb: any) {
            storageClient.retrieve(entry.partitionKey, entry.rowKey, function (error: any, entity: any, response: any) {
                if (!error) {
                    if (entity) {
                        var botData = entity.data || {};
                        var isCompressed = entity.isCompressed || false;
                        if (isCompressed) {
                            zlib.gunzip(new Buffer(botData, Consts.base64), function (err: Error, result: any) {
                                if (!err) {
                                    try {
                                        var txt = result.toString();
                                        data[entry.field + Consts.hash] = txt;
                                        data[entry.field] = txt != null ? JSON.parse(txt) : null;
                                    }
                                    catch (e) {
                                        err = e;
                                    }
                                }
                                cb(err);
                            });
                        }
                        else {
                            try {
                                data[entry.field + Consts.hash] = botData ? JSON.stringify(botData) : null;
                                data[entry.field] = botData != null ? botData : null;
                            }
                            catch (e) {
                                error = e;
                            }
                            cb(error);
                        }
                    }
                    else {
                        data[entry.field + Consts.hash] = null;
                        data[entry.field] = null;
                        cb(error);
                    }
                }
                else {
                    cb(error);
                }
            });
        }, function (err: Error) {
            if (!err) {
                callback(null, data);
            }
            else {
                var m = err.toString();
                callback(err instanceof Error ? err : new Error(m), null);
            }
        });

    }

    saveData(context: any, data: any, callback: any) {
        // console.log("=========saveData===========",context,data)
        var list: any = [];
        var _this = this;
        function addWrite(field: string, partitionKey: string, rowKey: string, botData: Object) {
            var hashKey = field + Consts.hash;
            var hash = JSON.stringify(botData);
            if (!data[hashKey] || hash !== data[hashKey]) {
                data[hashKey] = hash;
                list.push({ field: field, partitionKey: partitionKey, rowKey: rowKey, botData: botData, hash: hash });
            }

        }
        if (context.userId) {
            if (context.persistUserData) {
                addWrite(Consts.Fields.UserDataField, context.userId, Consts.Fields.UserDataField, data.userData);
            }
            if (context.conversationId) {
                addWrite(Consts.Fields.PrivateConversationDataField, context.conversationId, context.userId, data.privateConversationData);
            }
        }
        if (context.persistConversationData && context.conversationId) {
            addWrite(Consts.Fields.ConversationDataField, context.conversationId, Consts.Fields.ConversationDataField, data.conversationData);
        }

        async.each(list, function (entry: any, errorCallback: any) {
            // if (_this.options.gzipData) {
            //     zlib.gzip(entry.hash, function (err: any, result: any) {
            //         if (!err && result.length > Consts.maxDataLength) {
            //             err = new Error("Data of " + result.length + " bytes gzipped exceeds the " + Consts.maxDataLength + " byte limit. Can't post to: " + entry.url);
            //             err.code = Consts.ErrorCodes.MessageSize;
            //         }
            //         if (!err) {
            //             _this.storageClient.insertOrReplace(entry.partitionKey, entry.rowKey, result.toString('base64'), true, function (error: any, eTag: any, response: any) {
            //                 errorCallback(error);
            //             });
            //         }
            //         else {
            //             errorCallback(err);
            //         }
            //     });
            // }
            // else 
            if (entry.hash.length < Consts.maxDataLength) {
                _this.storageClient.insertOrReplace(entry.partitionKey, entry.rowKey, entry.botData, false, function (error: any, eTag: any, response: any) {
                    errorCallback(error);
                });
            }
            else {
                var err: any = new Error("Data of " + entry.hash.length + " bytes exceeds the " + Consts.maxDataLength + " byte limit. Consider setting connectors gzipData option. Can't post to: " + entry.url);
                err.code = Consts.ErrorCodes.MessageSize;
                errorCallback(err);
            }
        }, function (err: any) {
            if (callback) {
                if (!err) {
                    callback(null);
                }
                else {
                    var m = err.toString();
                    callback(err instanceof Error ? err : new Error(m));
                }
            }
        });

    }
}