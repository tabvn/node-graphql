import {
    GraphQLID,
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';
import Model from './model'
import DateTime from '../types/datetime'
import _ from 'lodash'

export default class Role extends Model {

    constructor(app) {
        super(app, 'role');
    }

    /**
     * Implement before create
     * @param model
     * @returns {Promise<any>}
     */
    beforeCreate(model) {


        return new Promise((resolve, reject) => {

            super.beforeCreate(model).then((model) => {

                const name = _.get(model, 'name');
                if (_.includes(['everyone', 'authenticated', 'owner'], name)) {
                    return reject(`Role ${name} already exist.`)
                }
                return resolve(model);

            }).catch((err) => {
                return reject(err);
            })
        })
    }

    /**
     * Override After delete model
     * @param model
     * @returns {Promise<any>}
     */
    afterDelete(id) {

        return new Promise((resolve, reject) => {

            super.afterDelete(id).then((id) => {

                this.ctx.models.user_role.find({roleId: id}).then((results) => {
                    _.each(results, (result) => {
                        this.ctx.models.user_role.delete(_.get(result, '_id')).then(() => {

                        });
                    });

                    return resolve(id);

                }).catch((err) => {
                    return reject(err);
                })

            }).catch((err) => {
                return reject(err);
            })
        })
    }

    /**
     *
     * @returns {{_id: {type}, name: {type, required: boolean}, created: {type, defaultValue: Date}, updated: {type, defaultValue: Date}}}
     */
    fields() {
        return {
            _id: {type: GraphQLID},
            name: {
                type: GraphQLNonNull(GraphQLString),
                required: true,
                unique: true,
                lowercase: true,
            },
            created: {
                type: DateTime,
                defaultValue: new Date(),
            },
            updated: {
                type: DateTime,
                defaultValue: new Date(),
            }
        }
    }

}