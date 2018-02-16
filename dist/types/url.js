'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _graphql = require('graphql');

var _error = require('graphql/error');

var _language = require('graphql/language');

// eslint-disable-next-line no-useless-escape, max-len
var URL_REGEX = new RegExp(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/);

exports.default = new _graphql.GraphQLScalarType({
    name: 'URL',

    // eslint-disable-next-line max-len
    description: 'A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.',

    serialize: function serialize(value) {
        if (typeof value !== 'string') {
            throw new TypeError('Value is not string: ' + value);
        }

        if (!URL_REGEX.test(value)) {
            throw new TypeError('Value is not a valid URL: ' + value);
        }

        return value;
    },
    parseValue: function parseValue(value) {
        if (typeof value !== 'string') {
            throw new TypeError('Value is not string: ' + value);
        }

        if (!URL_REGEX.test(value)) {
            throw new TypeError('Value is not a valid URL: ' + value);
        }

        return value;
    },
    parseLiteral: function parseLiteral(ast) {
        if (ast.kind !== _language.Kind.STRING) {
            throw new _error.GraphQLError('Can only validate strings as URLs but got a: ' + ast.kind);
        }

        if (!URL_REGEX.test(ast.value)) {
            throw new TypeError('Value is not a valid URL: ' + ast.value);
        }

        return ast.value;
    }
});
//# sourceMappingURL=url.js.map