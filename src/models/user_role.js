import {
    GraphQLID,
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';
import Model from './model'
import DateTime from '../types/datetime'
import _ from 'lodash'

export default class UserRole extends Model {

    constructor(app) {
        super(app, 'user_role');
    }


    /**
     * Implement before create
     * @param model
     */
    beforeCreate(model) {


        return new Promise((resolve, reject) => {


            super.beforeCreate(model).then((model) => {

                const query = {
                    $and: [
                        {userId: _.get(model, 'userId')},
                        {roleId: _.get(model, 'roleId')}
                    ]
                };

                this.findOne(query, null).then(result => {
                    if (result) {
                        return reject('Role already exist')
                    }

                    this.ctx.models.user.userRoles.remove(_.toString(_.get(model, 'userId')));

                    return resolve(model);

                }).catch((err) => {

                    return reject(err);
                });

            }).catch((err) => {
                return reject(err);

            });


        });
    }

    /**
     * Implement after delete model
     * @param id
     * @returns {Promise<any>}
     */
    afterDelete(id) {

        return new Promise((resolve, reject) => {

            super.afterDelete(id).then(id => {
                this.ctx.models.user.userRoles.remove(_.toString(id));
            }).catch((err) => reject(err));
        })
    }

    /**
     *
     * @returns {{_id: {type}, name: {type, required: boolean}, created: {type, defaultValue: Date}, updated: {type, defaultValue: Date}}}
     */
    fields() {
        return {
            _id: {type: GraphQLID},
            userId: {
                type: GraphQLNonNull(GraphQLString),
                required: true,
                objectId: true,
            },
            roleId: {
                type: GraphQLNonNull(GraphQLString),
                required: true,
                objectId: true,
            },
            created: {
                type: DateTime,
                defaultValue: new Date(),
            }
        }
    }

}