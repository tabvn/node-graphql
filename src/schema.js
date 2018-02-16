import {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLList,
    GraphQLID,
    GraphQLError
} from 'graphql';

import _ from 'lodash'

export default class Schema {

    constructor(ctx) {

        this.ctx = ctx;
        this._schema = null;
    }

    schema() {

        if (this._schema) {
            return this._schema;
        }

        const models = this.ctx.models;

        let queryFields = {};
        let mutationFields = {};

        _.each(models, (model) => {
            queryFields = _.assign(queryFields, model.query());
            mutationFields = Object.assign(mutationFields, model.mutation());
        });

        const Query = new GraphQLObjectType({
            name: 'Query',      //Return this type of object
            fields: () => (queryFields)
        });


        let Mutation = new GraphQLObjectType({
            name: "Mutation",
            fields: () => (mutationFields)
        });


        this._schema = new GraphQLSchema({
            query: Query,
            mutation: Mutation
        });

        return this._schema;
    }
}
