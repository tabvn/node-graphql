import {MongoClient} from 'mongodb'
import {database} from './config'
let db = null;

export const connect = () => {
    const url = database.dbUrl;
    const dbName = database.dbName;

    return new Promise((resolve, reject) => {
        if (db) {

            return resolve(db);
        }
        MongoClient.connect(url, function (err, client) {

            if (err) {
                return reject(err);
            }
            db = client.db(dbName);
            return resolve(db);


        });


    });


};