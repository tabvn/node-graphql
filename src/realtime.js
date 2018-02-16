import _ from 'lodash'
import {ObjectID} from 'mongodb';

import {Map} from 'immutable'


export default class Realtime {

    constructor(ctx) {
        this.ctx = ctx;
        this.wss = ctx.wss;
        // Store WebSocket Client in cache.
        this.connections = new Map();

        this.listenWebSocketClients();
    }

    /**
     * Find WebSocket client by UserId
     * @param userId
     * @returns {*}
     */

    getClientsByUserId(userId) {

        let clients = [];

        if (!userId || !ObjectID.isValid(userId)) {
            return clients;
        }

        if (typeof userId !== 'string') {

            userId = _.toString(userId);
        }

        return this.connections.filter((con) => _.toString(con.userId) === userId);
    }

    /**
     * Send message to users by IDs
     * @param userIds
     * @param message
     */
    sendToUsers(userIds = [], message) {
        if (!userIds || userIds.length === 0 || !message) {
            return
        }

        const connections = this.connections.filter((con) => _.includes(userIds, _.toString(con.userId)));


        if (connections && connections.size > 0) {
            connections.forEach((client) => {


                this.sendMessage(client, message);

            });
        }
    }


    /**
     * Generate WebSocket client id
     */
    generateClientId() {

        return new ObjectID().toString();
    }

    /**
     * Check if client is authenticated
     * @param id
     */

    isAuthenticated(id) {

        const client = this.getClient(id);
        return _.get(client, 'authenticated', false);
    }

    /**
     * Save WebSocket client to cache
     * @param id
     * @param ws
     * @returns {{id: *, userId: null, token: null, authenticated: boolean, ws: *, created: Date}}
     */
    setClient(id, client) {

        this.connections = this.connections.set(id, client);
        return client;


    }

    /**
     * Get WebSocket Client Info
     * @param id
     * @returns {ws:*, userId: ObjectId, authenticated: boolean} or null if empty
     */

    getClient(id) {
        const client = this.connections.get(id);
        return client ? client : null;
    }

    /**
     * Remove WebSocket Client
     * @param id
     */
    removeClient(id) {
        this.connections = this.connections.delete(id);
    }


    /**
     * Listen WebSocket Clients
     */

    listenWebSocketClients() {

        const wss = this.wss;


        wss.on('connection', (ws) => {

            // client is connected
            const clientId = this.generateClientId();

            const client = {
                id: clientId,
                ws: ws,
                userId: null,
                authenticated: false,
            };

            this.setClient(clientId, client);

            ws.on('message', (message) => {
                this.onMessage(clientId, message);

            });

            ws.on('close', () => {

                this.onDisconnected(clientId);

            });

        });

    }

    /**
     * Format message from string to json.
     * @param message
     * @returns {*}
     */
    messageToJson(message) {

        let json = message;

        try {
            json = JSON.parse(json);
        }
        catch (err) {
            console.log("Unable decode message to json");
        }

        return json;
    }


    /**
     * Listen Client message
     * @param client
     * @param message
     */
    onMessage(clientId, message) {

        const client = this.getClient(clientId);

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
    handleReceivedMessageEvent(client, message) {

        const action = _.get(message, 'action', '');
        const payload = _.get(message, 'payload');

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
    logout(client) {

        const userId = _.get(client, 'userId');
        const tokenId = _.get(client, 'token._id');
        client = _.setWith(client, 'authenticated', false);
        client = _.setWith(client, 'userId', null);
        client = _.setWith(client, 'token', null);
        this.setClient(_.get(client, 'id'), client);
        const clients = this.getClientsByUserId(userId);

        if (userId && tokenId) {
            if (!clients || clients.size === 1) {
                // set status of user is offline.

                this.ctx.models.user.updateAttribute(userId, {online: false}).then(() => {

                    this.ctx.models.token.delete(tokenId).then(() => {

                    });
                });

            }
        }


    }

    /**
     * Start check client with token.
     * @param client
     * @param token
     */
    auth(client, tokenId) {

        if (this.isAuthenticated(client.id)) {
            // client is already authenticated before.
            this.authSuccess(client.id, client.token);

        } else {

            // let verify token
            this.ctx.models.token.load(tokenId).then((token) => {
                this.authSuccess(client.id, token);
            }).catch(() => {
                this.authError(client.id);
            });

        }


    }

    /**
     * Client authenticated
     * @param client
     */
    authSuccess(clientId, token) {

        const client = this.getClient(clientId);

        client.authenticated = true;
        client.userId = token.userId;
        client.token = token;
        this.setClient(client.id, client);

        // need update online of user.
        const clients = this.getClientsByUserId(token.userId);


        if (!clients || clients.size < 2) {
            // set online
            this.ctx.models.user.updateAttribute(token.userId, {online: true}).then(() => {

            });
        }


        this.sendMessage(client, {action: 'auth_success', payload: client.token})
    }

    /**
     * Client is not authenticated and error
     * @param client
     */
    authError(clientId) {
        const client = this.getClient(clientId);
        client.authenticated = false;
        client.token = null;

        this.setClient(client.id, client); // update client to cache.

        this.sendMessage(client, {action: 'auth_error', payload: "Invalid Login Token"});
    }


    /**
     * Send a message to client.
     * @param client
     * @param message json data {action: string, payload: *}
     */
    sendMessage(client, message) {


        if (!client || !client.ws) {
            return
        }


        try {
            message = JSON.stringify(message);
        }
        catch (err) {
            console.log("An error convert object message to string.");
        }

        client.ws.send(message);
    }

    /**
     * On client disconnected
     * @param clientId
     */
    onDisconnected(clientId) {


        const client = this.getClient(clientId);
        const userId = _.get(client, 'userId');
        this.removeClient(client.id);

        if (userId) {
            // need update online of user.
            const findClient = this.connections.find((con) => {
                return _.toString(_.get(con, 'userId')) === _.toString(userId)
            });

            if (!findClient) {
                // set user to offline.
                this.ctx.models.user.updateAttribute(userId, {online: false}).then(() => {

                });
            }

        }

    }

}