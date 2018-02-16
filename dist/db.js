'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.connect = undefined;

var _mongodb = require('mongodb');

var _config = require('./config');

var db = null;

var connect = exports.connect = function connect() {
    var url = _config.database.dbUrl;
    var dbName = _config.database.dbName;

    return new Promise(function (resolve, reject) {
        if (db) {

            return resolve(db);
        }
        _mongodb.MongoClient.connect(url, function (err, client) {

            if (err) {
                return reject(err);
            }
            db = client.db(dbName);
            return resolve(db);
        });
    });
};
//# sourceMappingURL=db.js.map