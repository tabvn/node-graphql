'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _graphql = require('graphql');

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _datetime = require('../types/datetime');

var _datetime2 = _interopRequireDefault(_datetime);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UserRole = function (_Model) {
    _inherits(UserRole, _Model);

    function UserRole(app) {
        _classCallCheck(this, UserRole);

        return _possibleConstructorReturn(this, (UserRole.__proto__ || Object.getPrototypeOf(UserRole)).call(this, app, 'user_role'));
    }

    /**
     * Implement before create
     * @param model
     */


    _createClass(UserRole, [{
        key: 'beforeCreate',
        value: function beforeCreate(model) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {

                _get(UserRole.prototype.__proto__ || Object.getPrototypeOf(UserRole.prototype), 'beforeCreate', _this2).call(_this2, model).then(function (model) {

                    var query = {
                        $and: [{ userId: _lodash2.default.get(model, 'userId') }, { roleId: _lodash2.default.get(model, 'roleId') }]
                    };

                    _this2.findOne(query, null).then(function (result) {
                        if (result) {
                            return reject('Role already exist');
                        }

                        _this2.ctx.models.user.userRoles.remove(_lodash2.default.toString(_lodash2.default.get(model, 'userId')));

                        return resolve(model);
                    }).catch(function (err) {

                        return reject(err);
                    });
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Implement after delete model
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'afterDelete',
        value: function afterDelete(id) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {

                _get(UserRole.prototype.__proto__ || Object.getPrototypeOf(UserRole.prototype), 'afterDelete', _this3).call(_this3, id).then(function (id) {
                    _this3.ctx.models.user.userRoles.remove(_lodash2.default.toString(id));
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         *
         * @returns {{_id: {type}, name: {type, required: boolean}, created: {type, defaultValue: Date}, updated: {type, defaultValue: Date}}}
         */

    }, {
        key: 'fields',
        value: function fields() {
            return {
                _id: { type: _graphql.GraphQLID },
                userId: {
                    type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString),
                    required: true,
                    objectId: true
                },
                roleId: {
                    type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString),
                    required: true,
                    objectId: true
                },
                created: {
                    type: _datetime2.default,
                    defaultValue: new Date()
                }
            };
        }
    }]);

    return UserRole;
}(_model2.default);

exports.default = UserRole;
//# sourceMappingURL=user_role.js.map