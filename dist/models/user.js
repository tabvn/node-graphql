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

var _email = require('../types/email');

var _email2 = _interopRequireDefault(_email);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _immutable = require('immutable');

var _mongodb = require('mongodb');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var User = function (_Model) {
    _inherits(User, _Model);

    function User(ctx) {
        _classCallCheck(this, User);

        var _this = _possibleConstructorReturn(this, (User.__proto__ || Object.getPrototypeOf(User)).call(this, ctx, 'user'));

        _this.userRoles = new _immutable.Map();

        return _this;
    }

    /**
     * Event before model is delete
     * @param id
     * @returns {Promise<any>}
     */


    _createClass(User, [{
        key: 'beforeDelete',
        value: function beforeDelete(id) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {

                _get(User.prototype.__proto__ || Object.getPrototypeOf(User.prototype), 'beforeDelete', _this2).call(_this2, id).then(function (id) {

                    var relations = [_this2.ctx.models.token, _this2.ctx.models.user_role];

                    _lodash2.default.each(relations, function (relation) {

                        relation.find({ userId: id }).then(function (results) {

                            _lodash2.default.each(results, function (result) {

                                relation.delete(_lodash2.default.get(result, '_id')).then(function () {});
                            });
                        });
                    });

                    return resolve(id);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Create default user
         */

        /**
         * Get user roles name array
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'getUserRoles',
        value: function getUserRoles(id) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {

                if (!id || !_mongodb.ObjectID.isValid(id)) {
                    return reject("Invalid user Id");
                }

                // find in cache
                var roles = _this3.userRoles.get(_lodash2.default.toString(id));
                if (roles && roles.length) {
                    return resolve(roles);
                }

                var userId = _this3.objectId(id);

                var query = [{
                    $lookup: {
                        from: _this3.ctx.models.user_role.modelName,
                        localField: '_id',
                        foreignField: 'roleId',
                        as: 'user_role'
                    }
                }, { $unwind: { path: "$user_role", preserveNullAndEmptyArrays: true } }, {
                    $match: {
                        "user_role.userId": { $eq: userId }
                    }
                }, {
                    $project: {
                        _id: false,
                        name: "$name"
                    }
                }];

                _this3.ctx.models.role.aggregate(query).then(function (results) {

                    var roles = [];

                    _lodash2.default.each(results, function (result) {
                        roles.push(result.name);
                    });
                    // save cache
                    _this3.userRoles = _this3.userRoles.set(_lodash2.default.toString(id), roles);

                    return resolve(roles);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Get user role from request.
         * @param req
         * @param cb
         * @returns {Promise<any>}
         */

    }, {
        key: 'getUserRolesFromRequest',
        value: function getUserRolesFromRequest(req) {
            var _this4 = this;

            var userId = _lodash2.default.get(req, 'token.userId');

            var roles = ['everyone'];

            return new Promise(function (resolve, reject) {
                if (!userId) {
                    return resolve(roles);
                }
                roles.push('authenticated');

                _this4.getUserRoles(userId).then(function (results) {

                    if (results && results.length) {
                        roles = roles.concat(results);
                    }

                    return resolve(roles);
                }).catch(function (err) {

                    return reject(err);
                });
            });
        }

        /**
         * Login user
         * @param email
         * @param password
         * @returns {Promise<any>}
         */

    }, {
        key: 'login',
        value: function login(email, password) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                if (!email || !_this5.isEmail(email)) {
                    return reject("Invalid Email");
                }
                if (!password || password === "") {
                    return reject("Password is required");
                }

                email = _lodash2.default.toLower(email);
                _this5.findOne({ email: email }).then(function (model) {

                    if (model === null) {
                        return reject("Login Error");
                    }
                    var originalPassword = _lodash2.default.get(model, 'password');
                    var isMatched = _bcrypt2.default.compareSync(password, originalPassword);
                    if (isMatched) {

                        _this5.ctx.models.token.create({
                            userId: _lodash2.default.get(model, '_id'),
                            created: new Date()
                        }).then(function (token) {
                            token = _lodash2.default.setWith(token, 'user', model);

                            return resolve(token);
                        }).catch(function (err) {
                            return reject(err);
                        });
                    } else {
                        return reject("Password does not match.");
                    }
                }).catch(function (err) {

                    return reject('Login Error');
                });
            });
        }

        /**
         *
         * @returns {{_id: {type}, firstName: {type}, lastName: {type}, email: {type, unique: boolean, email: boolean, required: boolean}, password: {type, password: boolean, required: boolean, minLength: number}, active: {type, defaultValue: boolean}, created: {type, defaultValue: Date}}}
         */

    }, {
        key: 'fields',
        value: function fields() {
            return {
                _id: { type: _graphql.GraphQLID },
                firstName: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
                lastName: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
                email: { type: _email2.default, unique: true, email: true, required: true },
                password: { type: _graphql.GraphQLString, password: true, required: true, minLength: 3 },
                active: { type: _graphql.GraphQLBoolean, defaultValue: true },
                online: {
                    type: _graphql.GraphQLBoolean,
                    defaultValue: false
                },
                created: {
                    type: _datetime2.default,
                    defaultValue: new Date()
                },
                updated: {
                    type: _datetime2.default,
                    defaultValue: null
                }
            };
        }
    }, {
        key: 'query',
        value: function query() {
            var _this6 = this;

            var parentQuery = _get(User.prototype.__proto__ || Object.getPrototypeOf(User.prototype), 'query', this).call(this);

            var query = {
                me: {
                    type: this.schema(),
                    args: {},
                    resolve: function resolve(value, args, request) {
                        var userId = _lodash2.default.get(request, 'token.userId');

                        return new Promise(function (resolve, reject) {

                            _this6.load(userId).then(function (user) {
                                return resolve(user);
                            }).catch(function () {
                                return reject("Access denied");
                            });
                        });
                    }
                },
                roleOwner: {
                    type: new _graphql.GraphQLList(_graphql.GraphQLString),
                    args: {
                        _id: {
                            type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString)
                        }
                    },
                    resolve: function resolve(value, args, request) {

                        return new Promise(function (resolve, reject) {

                            var userId = _lodash2.default.get(args, '_id');

                            return _this6.getUserRoles(userId).then(function (roles) {
                                return resolve(roles);
                            }).catch(function (err) {
                                return reject(err);
                            });
                        });
                    }
                }
            };

            return Object.assign(parentQuery, query);
        }

        /**
         * Implements mutation
         */

    }, {
        key: 'mutation',
        value: function mutation() {
            var _this7 = this;

            var parentMutation = _get(User.prototype.__proto__ || Object.getPrototypeOf(User.prototype), 'mutation', this).call(this);

            var mutation = {
                login: {
                    type: new _graphql.GraphQLObjectType({
                        name: 'login',
                        fields: function fields() {
                            return Object.assign(_this7.ctx.models.token.fields(), {
                                user: {
                                    type: _this7.schema()
                                }
                            });
                        }
                    }),
                    args: {
                        email: {
                            name: 'email',
                            type: (0, _graphql.GraphQLNonNull)(_email2.default)
                        },
                        password: {
                            name: 'password',
                            type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString)
                        }
                    },
                    resolve: function resolve(value, args, request) {

                        return _this7.login(_lodash2.default.get(args, 'email'), _lodash2.default.get(args, 'password'));
                    }
                },
                logout: {

                    type: new _graphql.GraphQLObjectType({
                        name: 'logout',
                        fields: function fields() {
                            return {
                                success: {
                                    type: _graphql.GraphQLBoolean,
                                    defaultValue: true
                                }
                            };
                        }
                    }),
                    args: {
                        token: {
                            name: 'token',
                            type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString)
                        }
                    },
                    resolve: function resolve(value, args, request) {

                        return new Promise(function (resolve, reject) {

                            _this7.ctx.models.token.delete(_lodash2.default.get(args, 'token')).then(function () {

                                return resolve({
                                    success: true
                                });
                            }).catch(function (err) {
                                return reject(err);
                            });
                        });
                    }
                },
                updateUserRoles: {
                    type: new _graphql.GraphQLObjectType({
                        name: 'user_roles',
                        fields: function fields() {
                            return {
                                roles: {
                                    type: new _graphql.GraphQLList(_graphql.GraphQLString),
                                    defaultValue: []
                                }
                            };
                        }
                    }),
                    args: {
                        roles: {
                            type: (0, _graphql.GraphQLList)(_graphql.GraphQLString),
                            defaultValue: []
                        },
                        _id: {
                            type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString)
                        }
                    },
                    resolve: function () {
                        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(value, args, request) {
                            var allowed;
                            return regeneratorRuntime.wrap(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                        case 0:
                                            allowed = false;
                                            _context.prev = 1;
                                            _context.next = 4;
                                            return _this7.checkPermission(request, 'find', null);

                                        case 4:
                                            allowed = _context.sent;
                                            _context.next = 10;
                                            break;

                                        case 7:
                                            _context.prev = 7;
                                            _context.t0 = _context['catch'](1);

                                            allowed = false;

                                        case 10:
                                            return _context.abrupt('return', new Promise(function (resolve, reject) {
                                                if (!allowed) {
                                                    return reject("Access denied.");
                                                }

                                                var roleNames = _lodash2.default.get(args, 'roles', []);
                                                var userId = _this7.objectId(_lodash2.default.get(args, '_id'));

                                                roleNames = _lodash2.default.uniq(roleNames);

                                                var user_roles = [];

                                                if (roleNames.length) {
                                                    _this7.ctx.models.role.find({ name: { $in: roleNames } }).then(function (roles) {

                                                        _lodash2.default.each(roles, function (role) {

                                                            user_roles.push({
                                                                userId: userId,
                                                                roleId: role._id
                                                            });
                                                        });

                                                        _this7.ctx.models.user_role.collection.deleteMany({ userId: userId }, function (err, info) {
                                                            _this7.ctx.models.user_role.collection.insertMany(user_roles, function (err, info) {

                                                                if (err) {
                                                                    return reject(err);
                                                                }
                                                                _this7.userRoles = _this7.userRoles.set(_lodash2.default.get(args, '_id'), roleNames);
                                                                return resolve({ roles: roleNames });
                                                            });
                                                        });

                                                        // console.log(roles);
                                                    }).catch(function (err) {
                                                        return reject(err);
                                                    });
                                                } else {

                                                    _this7.ctx.models.user_role.collection.deleteMany({ userId: userId }, function (err, info) {
                                                        _this7.userRoles = _this7.userRoles.set(_lodash2.default.get(args, '_id'), []);
                                                        return err ? reject(err) : resolve({ roles: [] });
                                                    });
                                                }
                                            }));

                                        case 11:
                                        case 'end':
                                            return _context.stop();
                                    }
                                }
                            }, _callee, _this7, [[1, 7]]);
                        }));

                        function resolve(_x, _x2, _x3) {
                            return _ref.apply(this, arguments);
                        }

                        return resolve;
                    }()
                }
            };

            return Object.assign(parentMutation, mutation);
        }
    }]);

    return User;
}(_model2.default);

exports.default = User;
//# sourceMappingURL=user.js.map