import {
    GraphQLID,
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';
import Model from './model'
import DateTime from '../types/datetime'
import jwt from 'jsonwebtoken'
import {jwtSecret} from "../config";
import {Map} from 'immutable';

export default class Token extends Model {

    constructor(app) {
        super(app, 'token');

        this.jwt = new Map();
    }

    /**
     * Remove token
     * @param token
     */
    removeToken(token){
        this.jwt = this.jwt.remove(token);
    }

    /**
     * JWT sign
     * @param data
     * @returns {*}
     */
    jwtSign(data) {
        const token = jwt.sign(data, jwtSecret);
        this.jwt = this.jwt.set(token, data);

        return token;
    }

    /**
     * delete by Token
     * @param token
     * @returns {Promise<any>}
     */
    deleteToken(token){

        this.jwt = this.jwt.remove(token);

        return new Promise((resolve, reject) => {
            this.collection.deleteOne({jwt: token}, (err, result) => {
                return err ? reject(err): resolve({deleted: true});
            })
        });

    }
    /**
     * Verify toke n
     * @param token
     * @param ignoreExpiration
     * @returns {*}
     */
    jwtVerify(token, ignoreExpiration = true) {

        return new Promise((resolve, reject) => {

            const cache = this.jwt.get(token);
            if (!cache) {
                return reject("Not found");
            }
            jwt.verify(token, jwtSecret, {ignoreExpiration: ignoreExpiration}, (err, decoded) => {
                return err ? reject(err) : resolve(decoded);
            });
        })
    }

    beforeCreate(model) {

        return new Promise((resolve, reject) => {

            super.beforeCreate(model).then((model) => {
                model.jwt = this.jwtSign({userId: model.userId});
                return resolve(model);

            }).catch(err => {
                return reject(err);

            });

        })
    }

    /**
     *
     * @returns {{_id: {type}, created: {type, defaultValue: Date}, updated: {type, defaultValue: null}}}
     */
    fields() {
        return {
            _id: {type: GraphQLID},
            userId: {
                type: GraphQLNonNull(GraphQLString),
                objectId: true,
                required: true,
            },
            jwt: {
                type: GraphQLString,
            },
            created: {
                type: DateTime,
                defaultValue: new Date(),
            }
        }
    }

}