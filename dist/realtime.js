'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mongodb = require('mongodb');

var _immutable = require('immutable');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Realtime = function () {
    function Realtime(ctx) {
        _classCallCheck(this, Realtime);

        this.ctx = ctx;
        this.wss = ctx.wss;
        // Store WebSocket Client in cache.
        this.connections = new _immutable.Map();

        this.listenWebSocketClients();
    }

    /**
     * Find WebSocket client by UserId
     * @param userId
     * @returns {*}
     */

    _createClass(Realtime, [{
        key: 'getClientsByUserId',
        value: function getClientsByUserId(userId) {

            var clients = [];

            if (!userId || !_mongodb.ObjectID.isValid(userId)) {
                return clients;
            }

            if (typeof userId !== 'string') {

                userId = _lodash2.default.toString(userId);
            }

            return this.connections.filter(function (con) {
                return _lodash2.default.toString(con.userId) === userId;
            });
        }

        /**
         * Send message to users by IDs
         * @param userIds
         * @param message
         */

    }, {
        key: 'sendToUsers',
        value: function sendToUsers() {
            var _this = this;

            var userIds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
            var message = arguments[1];

            if (!userIds || userIds.length === 0 || !message) {
                return;
            }

            var connections = this.connections.filter(function (con) {
                return _lodash2.default.includes(userIds, _lodash2.default.toString(con.userId));
            });

            if (connections && connections.size > 0) {
                connections.forEach(function (client) {

                    _this.sendMessage(client, message);
                });
            }
        }

        /**
         * Generate WebSocket client id
         */

    }, {
        key: 'generateClientId',
        value: function generateClientId() {

            return new _mongodb.ObjectID().toString();
        }

        /**
         * Check if client is authenticated
         * @param id
         */

    }, {
        key: 'isAuthenticated',
        value: function isAuthenticated(id) {

            var client = this.getClient(id);
            return _lodash2.default.get(client, 'authenticated', false);
        }

        /**
         * Save WebSocket client to cache
         * @param id
         * @param ws
         * @returns {{id: *, userId: null, token: null, authenticated: boolean, ws: *, created: Date}}
         */

    }, {
        key: 'setClient',
        value: function setClient(id, client) {

            this.connections = this.connections.set(id, client);
            return client;
        }

        /**
         * Get WebSocket Client Info
         * @param id
         * @returns {ws:*, userId: ObjectId, authenticated: boolean} or null if empty
         */

    }, {
        key: 'getClient',
        value: function getClient(id) {
            var client = this.connections.get(id);
            return client ? client : null;
        }

        /**
         * Remove WebSocket Client
         * @param id
         */

    }, {
        key: 'removeClient',
        value: function removeClient(id) {
            this.connections = this.connections.delete(id);
        }

        /**
         * Listen WebSocket Clients
         */

    }, {
        key: 'listenWebSocketClients',
        value: function listenWebSocketClients() {
            var _this2 = this;

            var wss = this.wss;

            wss.on('connection', function (ws) {

                // client is connected
                var clientId = _this2.generateClientId();

                var client = {
                    id: clientId,
                    ws: ws,
                    userId: null,
                    authenticated: false
                };

                _this2.setClient(clientId, client);

                ws.on('message', function (message) {
                    _this2.onMessage(clientId, message);
                });

                ws.on('close', function () {

                    _this2.onDisconnected(clientId);
                });
            });
        }

        /**
         * Format message from string to json.
         * @param message
         * @returns {*}
         */

    }, {
        key: 'messageToJson',
        value: function messageToJson(message) {

            var json = message;

            try {
                json = JSON.parse(json);
            } catch (err) {
                console.log("Unable decode message to json");
            }

            return json;
        }

        /**
         * Listen Client message
         * @param client
         * @param message
         */

    }, {
        key: 'onMessage',
        value: function onMessage(clientId, message) {

            var client = this.getClient(clientId);

            if (typeof message === 'string') {

                message = this.messageToJson(message);

                this.handleReceivedMessageEvent(client, message);
            } else {
                // this can be data message and we handle in future.

            }
        }

        /**
         * Process message events depend on action.
         * @param client
         * @param message
         */

    }, {
        key: 'handleReceivedMessageEvent',
        value: function handleReceivedMessageEvent(client, message) {

            var action = _lodash2.default.get(message, 'action', '');
            var payload = _lodash2.default.get(message, 'payload');

            switch (action) {

                case 'auth':
                    // payload is access token id.
                    this.auth(client, payload);

                    break;

                case 'logout':

                    this.logout(client);
                    break;
                default:

                    break;
            }
        }

        /**
         * Handle sign out user
         * @param client
         * @param tokenId
         */

    }, {
        key: 'logout',
        value: function logout(client) {
            var _this3 = this;

            var userId = _lodash2.default.get(client, 'userId');
            var tokenId = _lodash2.default.get(client, 'token._id');
            client = _lodash2.default.setWith(client, 'authenticated', false);
            client = _lodash2.default.setWith(client, 'userId', null);
            client = _lodash2.default.setWith(client, 'token', null);
            this.setClient(_lodash2.default.get(client, 'id'), client);
            var clients = this.getClientsByUserId(userId);

            if (userId && tokenId) {
                if (!clients || clients.size === 1) {
                    // set status of user is offline.

                    this.ctx.models.user.updateAttribute(userId, { online: false }).then(function () {

                        _this3.ctx.models.token.delete(tokenId).then(function () {});
                    });
                }
            }
        }

        /**
         * Start check client with token.
         * @param client
         * @param token
         */

    }, {
        key: 'auth',
        value: function auth(client, tokenId) {
            var _this4 = this;

            if (this.isAuthenticated(client.id)) {
                // client is already authenticated before.
                this.authSuccess(client.id, client.token);
            } else {

                // let verify token
                this.ctx.models.token.load(tokenId).then(function (token) {
                    _this4.authSuccess(client.id, token);
                }).catch(function () {
                    _this4.authError(client.id);
                });
            }
        }

        /**
         * Client authenticated
         * @param client
         */

    }, {
        key: 'authSuccess',
        value: function authSuccess(clientId, token) {

            var client = this.getClient(clientId);

            client.authenticated = true;
            client.userId = token.userId;
            client.token = token;
            this.setClient(client.id, client);

            // need update online of user.
            var clients = this.getClientsByUserId(token.userId);

            if (!clients || clients.size < 2) {
                // set online
                this.ctx.models.user.updateAttribute(token.userId, { online: true }).then(function () {});
            }

            this.sendMessage(client, { action: 'auth_success', payload: client.token });
        }

        /**
         * Client is not authenticated and error
         * @param client
         */

    }, {
        key: 'authError',
        value: function authError(clientId) {
            var client = this.getClient(clientId);
            client.authenticated = false;
            client.token = null;

            this.setClient(client.id, client); // update client to cache.

            this.sendMessage(client, { action: 'auth_error', payload: "Invalid Login Token" });
        }

        /**
         * Send a message to client.
         * @param client
         * @param message json data {action: string, payload: *}
         */

    }, {
        key: 'sendMessage',
        value: function sendMessage(client, message) {

            if (!client || !client.ws) {
                return;
            }

            try {
                message = JSON.stringify(message);
            } catch (err) {
                console.log("An error convert object message to string.");
            }

            client.ws.send(message);
        }

        /**
         * On client disconnected
         * @param clientId
         */

    }, {
        key: 'onDisconnected',
        value: function onDisconnected(clientId) {

            var client = this.getClient(clientId);
            var userId = _lodash2.default.get(client, 'userId');
            this.removeClient(client.id);

            if (userId) {
                // need update online of user.
                var findClient = this.connections.find(function (con) {
                    return _lodash2.default.toString(_lodash2.default.get(con, 'userId')) === _lodash2.default.toString(userId);
                });

                if (!findClient) {
                    // set user to offline.
                    this.ctx.models.user.updateAttribute(userId, { online: false }).then(function () {});
                }
            }
        }
    }]);

    return Realtime;
}();

exports.default = Realtime;
//# sourceMappingURL=realtime.js.map