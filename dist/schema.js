'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _graphql = require('graphql');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Schema = function () {
    function Schema(ctx) {
        _classCallCheck(this, Schema);

        this.ctx = ctx;
        this._schema = null;
    }

    _createClass(Schema, [{
        key: 'schema',
        value: function schema() {

            if (this._schema) {
                return this._schema;
            }

            var models = this.ctx.models;

            var queryFields = {};
            var mutationFields = {};

            _lodash2.default.each(models, function (model) {
                queryFields = _lodash2.default.assign(queryFields, model.query());
                mutationFields = Object.assign(mutationFields, model.mutation());
            });

            var Query = new _graphql.GraphQLObjectType({
                name: 'Query', //Return this type of object
                fields: function fields() {
                    return queryFields;
                }
            });

            var Mutation = new _graphql.GraphQLObjectType({
                name: "Mutation",
                fields: function fields() {
                    return mutationFields;
                }
            });

            this._schema = new _graphql.GraphQLSchema({
                query: Query,
                mutation: Mutation
            });

            return this._schema;
        }
    }]);

    return Schema;
}();

exports.default = Schema;
//# sourceMappingURL=schema.js.map