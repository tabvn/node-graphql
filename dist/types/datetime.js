'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _graphql = require('graphql');

var _error = require('graphql/error');

var _language = require('graphql/language');

exports.default = new _graphql.GraphQLScalarType({
    name: 'DateTime',

    // eslint-disable-next-line max-len
    description: 'Use JavaScript Date object for date/tiem fields.',

    serialize: function serialize(value) {
        if (!(value instanceof Date)) {
            throw new TypeError('Value is not an instance of Date: ' + value);
        }

        if (isNaN(value.getTime())) {
            throw new TypeError('Value is not a valid Date: ' + value);
        }

        return value.toJSON();
    },
    parseValue: function parseValue(value) {
        var date = new Date(value);

        if (isNaN(date.getTime())) {
            throw new TypeError('Value is not a valid Date: ' + value);
        }

        return date;
    },
    parseLiteral: function parseLiteral(ast) {
        if (ast.kind !== _language.Kind.STRING) {
            throw new _error.GraphQLError('Can only parse strings to dates but got a: ' + ast.kind);
        }

        var result = new Date(ast.value);

        if (isNaN(result.getTime())) {
            throw new _error.GraphQLError('Value is not a valid Date: ' + ast.value);
        }
        if (ast.value !== result.toJSON()) {
            throw new _error.GraphQLError('Value is not a valid Date format (YYYY-MM-DDTHH:MM:SS.SSSZ): ' + ast.value);
        }
        return result;
    }
});
//# sourceMappingURL=datetime.js.map