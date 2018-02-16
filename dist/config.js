'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var production = exports.production = false; // change to true when deployment to server
var appPort = exports.appPort = 3001;
var rootUser = exports.rootUser = {
    firstName: 'Admin',
    lastName: 'Mr',
    email: 'toan@tabvn.com',
    password: '$2a$10$90jY811.WpnWOoL62XKzUeyLp.eNvYvetPBL4qcY13s2ooHAKsa6C'
};
var database = exports.database = {
    dbName: 'tabvn',
    dbUrl: 'mongodb://localhost:27017'
};
//# sourceMappingURL=config.js.map