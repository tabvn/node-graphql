import {
    GraphQLID,
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';
import Model from './model'
import DateTime from '../types/datetime'

export default class Token extends Model {

    constructor(app) {
        super(app, 'token');
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
            created: {
                type: DateTime,
                defaultValue: new Date(),
            }
        }
    }

}