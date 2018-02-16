import http from 'http'
import path from 'path'
import express from 'express'
import graphqlHTTP from 'express-graphql'
import cors from 'cors'
import {connect} from './db'
import Models from './models'
import Schema from './schema'
import Realtime from "./realtime"
import WebSocketServer from 'uws'
import {appPort,production} from "./config"
import boot from './boot'
import _ from 'lodash'

const PORT = appPort;

const app = express();
app.server = http.createServer(app);

app.use(cors({
    exposedHeaders: "*"
}));

app.wss = new WebSocketServer.Server({
    server: app.server
});


let ctx = {};

connect().then((db) => {
    ctx.db = db;
    ctx.models = new Models(ctx).getModels();
    ctx.wss = app.wss;
    ctx.realtime = new Realtime(ctx);

    boot(ctx);


}).catch((err) => {
    throw err;
});

app.ctx = ctx;

const handleRequest = graphqlHTTP(async (request) => {

    let tokenId = request.header('authorization');
    if(!tokenId){
        tokenId = _.get(request, 'query.auth', null);
    }

    request.ctx = ctx;
    let token = null;
    if (tokenId) {
        try {
            token = await ctx.models.token.load(tokenId);
        } catch (err) {
            token = null;
        }
    }

    request.token = token;

    return {
        schema: new Schema(ctx).schema(),
        graphiql: production ? false : true,
    };
});

app.use('/api', handleRequest);
app.use('/', express.static(path.join(__dirname, 'public')));

app.server.listen(PORT, () => {
    console.log(`App is running on port ${app.server.address().port}`);
});