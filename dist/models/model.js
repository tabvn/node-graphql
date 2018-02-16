'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _graphql = require('graphql');

var _mongodb = require('mongodb');

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _immutable = require('immutable');

require('babel-polyfill');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
    function Model(ctx, name) {
        _classCallCheck(this, Model);

        this.ctx = ctx;
        this.modelName = name;
        this.collection = this.ctx.db.collection(name);

        this._schema = null;
        this._fields = null;
        this.cache = new _immutable.Map();

        this.modelDidLoad();
    }

    _createClass(Model, [{
        key: 'modelDidLoad',
        value: function modelDidLoad() {}

        /**
         * Create object Id
         * @param id
         * @returns {*}
         */

    }, {
        key: 'objectId',
        value: function objectId(id) {

            if (typeof id !== 'string') {

                return id;
            }

            try {

                id = new _mongodb.ObjectID(id);
            } catch (err) {

                console.log(err);
            }

            return id;
        }

        /**
         * Find one model
         * @param query
         * @param options
         * @returns {Promise<any>}
         */

    }, {
        key: 'findOne',
        value: function findOne(query) {
            var _this = this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


            return new Promise(function (resolve, reject) {

                _this.collection.findOne(query, options, function (err, result) {
                    return err ? reject(err) : resolve(result);
                });
            });
        }

        /**
         * Find model
         * @param query
         * @param filter
         * @returns {Promise<any>}
         */

    }, {
        key: 'find',
        value: function find() {
            var _this2 = this;

            var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


            return new Promise(function (resolve, reject) {

                _this2.collection.find(query).limit(_lodash2.default.get(filter, 'limit', 50)).skip(_lodash2.default.get(filter, 'skip', 0)).sort({ created: -1 }).toArray(function (err, results) {

                    return err ? reject(err) : resolve(results);
                });
            });
        }

        /**
         * Get model in cache by String ID
         * @param id
         * @returns {V | undefined}
         */

    }, {
        key: 'cacheGet',
        value: function cacheGet(id) {

            if (typeof id !== "string") {
                id = _lodash2.default.toString(id);
            }

            return this.cache.get(id);
        }

        /**
         * Save Model to cache
         * @param id
         * @param model
         */

    }, {
        key: 'cacheSet',
        value: function cacheSet(id, model) {

            if (typeof id !== "string") {
                id = _lodash2.default.toString(id);
            }

            this.cache = this.cache.set(id, model);
        }

        /**
         * Remove model from cache
         * @param id
         */

    }, {
        key: 'cacheRemove',
        value: function cacheRemove(id) {
            if (typeof id !== "string") {
                id = _lodash2.default.toString(id);
            }
            this.cache = this.cache.remove(id);
        }

        /**
         * Clear cache
         */

    }, {
        key: 'clearCache',
        value: function clearCache() {

            this.cache = this.cache.clear();
        }
    }, {
        key: 'count',
        value: function count(query) {
            var _this3 = this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


            return new Promise(function (resolve, reject) {

                _this3.collection.count(query, options, function (err, result) {
                    return err ? reject(err) : resolve(result ? result : 0);
                });
            });
        }

        /**
         * Get model
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'load',
        value: function load(id) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {

                var cache = _this4.cacheGet(id);
                if (cache) {
                    return resolve(cache);
                }
                if (!_mongodb.ObjectID.isValid(id)) {
                    return reject("Invalid ID");
                }

                id = _this4.objectId(id);

                _this4.collection.findOne({ _id: id }, function (err, model) {

                    if (err === null && model) {
                        _this4.cacheSet(id, model);
                    }
                    return err || !model ? reject('Not found') : resolve(model);
                });
            });
        }

        /**
         * Aggregate query
         * @param query
         * @returns {Promise<any>}
         */

    }, {
        key: 'aggregate',
        value: function aggregate(query) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {

                _this5.collection.aggregate(query, { allowDiskUse: true }, function (err, result) {

                    if (err) {
                        return reject(err);
                    }
                    result.toArray(function (err, results) {

                        return err ? reject(err) : resolve(results);
                    });
                });
            });
        }

        /**
         * Validate email address
         * @param email
         * @returns {boolean}
         */

    }, {
        key: 'isEmail',
        value: function isEmail() {
            var email = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";


            var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(email);
        }

        /**
         * Validate model before save
         * @returns {Promise<any>}
         */

    }, {
        key: 'validate',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var _this6 = this;

                var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var model = arguments[1];
                var fields, uniqueFields, data, passwordFields, errors, originalModel;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                fields = this.fields();
                                uniqueFields = [];
                                data = {};
                                passwordFields = [];
                                errors = [];


                                _lodash2.default.each(fields, function (field, fieldName) {

                                    var isRequired = _lodash2.default.get(field, 'required', false);
                                    var value = _lodash2.default.get(model, fieldName);
                                    var isEmail = _lodash2.default.get(field, 'email', false);
                                    var isUnique = _lodash2.default.get(field, 'unique', false);
                                    var isPassword = _lodash2.default.get(field, 'password', false);
                                    var isObjectId = _lodash2.default.get(field, 'objectId', false);
                                    var isMinLength = _lodash2.default.get(field, 'minLength', 0);
                                    var isLowercase = _lodash2.default.get(field, 'lowercase', false);

                                    data[fieldName] = _lodash2.default.get(model, fieldName, _lodash2.default.get(field, 'defaultValue'));
                                    if (isEmail) {
                                        data[fieldName] = _lodash2.default.toLower(_lodash2.default.get(data, fieldName));
                                    }
                                    if (isLowercase) {
                                        data[fieldName] = _lodash2.default.toLower(_lodash2.default.get(data, fieldName));
                                    }

                                    if (isUnique) {
                                        uniqueFields.push({ name: fieldName, value: value });
                                    }
                                    if (isEmail && !_this6.isEmail(value)) {
                                        errors.push(fieldName + ' must be an email format.');
                                    }
                                    if (isRequired && !value && value === "") {
                                        if (!isPassword && id !== null) {
                                            errors.push(fieldName + ' is required.');
                                        }
                                    }
                                    if (!isPassword && isMinLength && value.length < isMinLength) {
                                        errors.push(fieldName + ' must greater than ' + isMinLength + ' characters.');
                                    }
                                    if (isPassword) {
                                        passwordFields.push({ name: fieldName, value: value });
                                    }
                                    if (isPassword && id === null && (!value || value === "" || value.length < isMinLength)) {
                                        errors.push(fieldName + ' must greater than ' + isMinLength + ' characters.');
                                    }
                                    if (isPassword && value && value !== "" && value.length >= isMinLength) {
                                        data[fieldName] = _bcrypt2.default.hashSync(_lodash2.default.get(data, fieldName), 10);
                                    }

                                    if (isObjectId) {
                                        if (Array.isArray(value)) {

                                            _lodash2.default.each(value, function (v, index) {

                                                value[index] = _lodash2.default.toString(v);
                                            });

                                            value = _lodash2.default.uniq(value);

                                            var objectIds = [];

                                            _lodash2.default.each(value, function (v) {
                                                if (!_mongodb.ObjectID.isValid(v)) {
                                                    errors.push(fieldName + ' is invalid');
                                                }
                                                objectIds.push(_this6.objectId(v));
                                            });

                                            data[fieldName] = objectIds;
                                        } else {
                                            if (!_mongodb.ObjectID.isValid(value)) {

                                                errors.push(fieldName + ' is invalid');
                                            }

                                            data[fieldName] = _this6.objectId(value);
                                        }
                                    }
                                });

                                if (!(passwordFields.length && id)) {
                                    _context.next = 11;
                                    break;
                                }

                                _context.next = 9;
                                return this.load(id);

                            case 9:
                                originalModel = _context.sent;

                                _lodash2.default.each(passwordFields, function (field) {
                                    var originPassword = _lodash2.default.get(originalModel, field.name);
                                    if (!field.value || field.value === "" || field.value === originPassword || _bcrypt2.default.compareSync(field.value, originPassword)) {
                                        data[field.name] = originPassword;
                                    }
                                });

                            case 11:

                                if (!id) {
                                    _lodash2.default.unset(data, '_id');
                                }

                                return _context.abrupt('return', new Promise(function (resolve, reject) {

                                    if (errors.length) {
                                        return reject(errors);
                                    }
                                    if (uniqueFields.length) {

                                        var uniqueFieldNames = [];

                                        var orQuery = [];

                                        _lodash2.default.each(uniqueFields, function (f) {
                                            var fieldName = f.name;
                                            var fieldValue = _lodash2.default.toLower(_lodash2.default.trim(f.value));

                                            var subQuery = {};

                                            subQuery[fieldName] = { $eq: fieldValue };
                                            orQuery.push(subQuery);
                                            uniqueFieldNames.push(f.name);
                                        });

                                        var query = {
                                            $and: []
                                        };

                                        query.$and.push({ $or: orQuery });

                                        if (id) {
                                            query.$and.push({ _id: { $ne: _this6.objectId(id) } });
                                        }
                                        _this6.findOne(query, null).then(function (result) {

                                            if (result !== null) {

                                                var validateError = null;

                                                if (uniqueFieldNames.length) {
                                                    validateError = _lodash2.default.join(uniqueFieldNames, ', ') + ' is already used please choose another one.';
                                                }
                                                return reject(validateError);
                                            }

                                            resolve(data);
                                        }).catch(function (err) {

                                            return reject(err);
                                        });
                                    } else {
                                        return resolve(data);
                                    }
                                }));

                            case 13:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function validate() {
                return _ref.apply(this, arguments);
            }

            return validate;
        }()

        /**
         * Event before model is create
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'beforeCreate',
        value: function beforeCreate(model) {
            return new Promise(function (resolve, reject) {
                return resolve(model);
            });
        }

        /**
         * Create model
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'create',
        value: function create() {
            var _this7 = this;

            var model = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


            return new Promise(function (resolve, reject) {

                _this7.validate(null, model).then(function (model) {

                    _this7.beforeCreate(model).then(function (model) {

                        _this7.collection.insertOne(model, function (err, info) {

                            if (!err) {
                                _this7.cacheSet(_lodash2.default.get(model, '_id'), model);

                                _this7.afterCreate(model).then(function (model) {});
                            }
                            return err ? reject(err) : resolve(model);
                        });
                    }).catch(function (err) {
                        return reject(err);
                    });
                }).catch(function (err) {

                    return reject(err);
                });
            });
        }

        /**
         * Event will fired after model is created.
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'afterCreate',
        value: function afterCreate(model) {
            var _this8 = this;

            return new Promise(function (resolve, reject) {

                var payload = {
                    event: 'model_added',
                    modelName: _this8.modelName,
                    model: model
                };

                _this8.notification(payload).then(function () {});

                return resolve(model);
            });
        }

        /**
         * Before update model
         * @param id
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'beforeUpdate',
        value: function beforeUpdate(id, model) {

            return new Promise(function (resolve, reject) {

                return resolve(model);
            });
        }

        /**
         * After model is updated
         * @param id
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'afterUpdate',
        value: function afterUpdate(id, model) {
            var _this9 = this;

            return new Promise(function (resolve, reject) {

                var payload = {
                    event: 'model_updated',
                    modelName: _this9.modelName,
                    model: model
                };

                _this9.notification(payload).then(function () {});

                return resolve(model);
            });
        }

        /**
         *
         * @param payload
         * @returns {Promise<any>}
         */

    }, {
        key: 'notification',
        value: function notification(payload) {
            return new Promise(function (resolve, reject) {
                return resolve(payload);
            });
        }

        /**
         * Update model attribute
         * @param id
         * @param attr
         * @returns {Promise<any>}
         */

    }, {
        key: 'updateAttribute',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id, attr) {
                var model;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.load(id);

                            case 2:
                                model = _context2.sent;


                                _lodash2.default.each(attr, function (value, key) {
                                    model = _lodash2.default.setWith(model, key, value);
                                });
                                return _context2.abrupt('return', this.update(id, model));

                            case 5:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function updateAttribute(_x8, _x9) {
                return _ref2.apply(this, arguments);
            }

            return updateAttribute;
        }()

        /**
         * Update model
         * @param id
         * @param model
         * @returns {Promise<any>}
         */

    }, {
        key: 'update',
        value: function update() {
            var _this10 = this;

            var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            var model = arguments[1];


            return new Promise(function (resolve, reject) {
                if (!id || !_mongodb.ObjectID.isValid(id)) {
                    return reject("Invalid ID");
                }
                _this10.validate(id, model).then(function (model) {

                    var fields = _this10.fields();

                    id = _this10.objectId(id);

                    var query = {
                        _id: id
                    };

                    if (_lodash2.default.get(fields, 'updated')) {
                        model = _lodash2.default.setWith(model, 'updated', new Date());
                    }
                    model = _lodash2.default.setWith(model, '_id', id);

                    _this10.beforeUpdate(id, model).then(function (model) {
                        _this10.collection.updateOne(query, { $set: model }, function (err, result) {
                            if (err || !_lodash2.default.get(result, 'matchedCount')) {
                                return reject(err ? err : 'Model not found');
                            }

                            _this10.afterUpdate(id, model).then(function () {});

                            _this10.cacheSet(id, model);

                            return resolve(model);
                        });
                    }).catch(function (err) {
                        return reject(err);
                    });
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Before delete model
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'beforeDelete',
        value: function beforeDelete(id) {

            return new Promise(function (resolve, reject) {
                return resolve(id);
            });
        }

        /**
         * After model is deleted
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'afterDelete',
        value: function afterDelete(id) {
            var _this11 = this;

            return new Promise(function (resolve, reject) {
                var payload = {
                    event: 'model_deleted',
                    modelName: _this11.modelName,
                    model: null,
                    id: id
                };

                _this11.notification(payload).then(function () {});

                return resolve(id);
            });
        }

        /**
         * Delete model
         * @param id
         * @returns {Promise<any>}
         */

    }, {
        key: 'delete',
        value: function _delete(id) {
            var _this12 = this;

            return new Promise(function (resolve, reject) {

                if (!id || !_mongodb.ObjectID.isValid(id)) {
                    return reject("Invalid ID");
                }

                id = _this12.objectId(id);

                _this12.beforeDelete(id).then(function () {
                    _this12.cacheRemove(id);

                    _this12.collection.deleteOne({ _id: id }, function (err, result) {

                        if (err === null) {

                            _this12.afterDelete(id).then(function () {});
                        }
                        return err ? reject(err) : resolve({
                            _id: id
                        });
                    });
                }).catch(function (err) {

                    return reject(err);
                });
            });
        }

        /**
         * permission
         */

    }, {
        key: 'permissions',
        value: function permissions() {

            return [{
                accessType: '*',
                role: 'everyone',
                permission: 'DENY'
            }, {
                accessType: '*',
                role: 'administrator',
                permission: 'ALLOW'
            }, {
                accessType: 'findById',
                role: 'owner',
                permission: 'ALLOW'
            }, {
                accessType: 'updateById',
                role: 'owner',
                permission: 'ALLOW'
            }];
        }

        /**
         * Check model permission
         * @param req
         * @param accessType
         * @param id
         */

    }, {
        key: 'checkPermission',
        value: function checkPermission(req) {
            var _this13 = this;

            var accessType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '*';
            var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;


            return new Promise(function (resolve, reject) {

                _this13.ctx.models.user.getUserRolesFromRequest(req).then(function (roles) {

                    _this13.roleRegister(req, accessType, id).then(function (dynamicRoles) {
                        roles = roles.concat(dynamicRoles);

                        _this13.checkPermissionByRoles(roles, accessType).then(function () {

                            return resolve(true);
                        }).catch(function (err) {
                            return reject(err);
                        });
                    });
                });
            });
        }

        /**
         * Check permission by roles and access type
         * @param roles
         * @param accessType
         * @returns {Promise<any>}
         */

    }, {
        key: 'checkPermissionByRoles',
        value: function checkPermissionByRoles() {
            var roles = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
            var accessType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '*';


            var isAllowed = true;
            var permissions = this.permissions();

            _lodash2.default.each(roles, function (role) {

                _lodash2.default.each(permissions, function (perm) {
                    var accessTypeRule = _lodash2.default.get(perm, 'accessType');

                    if ((accessTypeRule === '*' || accessTypeRule === accessType) && role === _lodash2.default.get(perm, 'role') && _lodash2.default.get(perm, 'permission') === 'ALLOW') {
                        isAllowed = true;
                    }
                    if ((accessTypeRule === '*' || accessTypeRule === accessType) && role === _lodash2.default.get(perm, 'role') && _lodash2.default.get(perm, 'permission') === 'DENY') {
                        isAllowed = false;
                    }
                });
            });

            return new Promise(function (resolve, reject) {
                return isAllowed ? resolve(true) : reject('Access denied.');
            });
        }

        /**
         *
         * @param req
         * @param accessType
         * @param id
         * @returns {Promise<void>}
         */

    }, {
        key: 'roleRegister',
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req) {
                var _this14 = this;

                var accessType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
                var userId, model;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                userId = _lodash2.default.get(req, 'token.userId');
                                model = null;

                                if (!id) {
                                    _context3.next = 12;
                                    break;
                                }

                                _context3.prev = 3;
                                _context3.next = 6;
                                return this.load(id);

                            case 6:
                                model = _context3.sent;
                                _context3.next = 12;
                                break;

                            case 9:
                                _context3.prev = 9;
                                _context3.t0 = _context3['catch'](3);

                                console.log(_context3.t0);

                            case 12:
                                return _context3.abrupt('return', new Promise(function (resolve, reject) {

                                    if (!id || !userId || !_mongodb.ObjectID.isValid(id) || !_mongodb.ObjectID.isValid(userId)) {
                                        return resolve([]);
                                    }

                                    if (accessType === 'findById' || accessType === 'updateById' || accessType === 'deleteById' && userId && id) {

                                        if (_this14.modelName === 'user') {

                                            if (_lodash2.default.toString(_lodash2.default.get(model, '_id')) === _lodash2.default.toString(userId)) {
                                                return resolve(['owner']);
                                            }
                                        } else {
                                            if (_lodash2.default.toString(_lodash2.default.get(model, 'userId')) === _lodash2.default.toString(userId)) {

                                                return resolve(['owner']);
                                            }
                                        }
                                        return resolve([]);
                                    } else {
                                        return resolve([]);
                                    }
                                }));

                            case 13:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[3, 9]]);
            }));

            function roleRegister(_x17) {
                return _ref3.apply(this, arguments);
            }

            return roleRegister;
        }()

        /**
         * Queries
         * @returns {{}}
         */

    }, {
        key: 'query',
        value: function query() {
            var _this15 = this,
                _ref7;

            return _ref7 = {}, _defineProperty(_ref7, this.modelName, {
                type: this.schema(),
                args: {
                    _id: {
                        type: _graphql.GraphQLID
                    }
                },
                resolve: function () {
                    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(value, args, request) {
                        var id, model, allowed;
                        return regeneratorRuntime.wrap(function _callee4$(_context4) {
                            while (1) {
                                switch (_context4.prev = _context4.next) {
                                    case 0:
                                        id = _lodash2.default.get(args, '_id');
                                        model = null;
                                        allowed = false;
                                        _context4.prev = 3;
                                        _context4.next = 6;
                                        return _this15.checkPermission(request, 'findById', id);

                                    case 6:
                                        allowed = _context4.sent;
                                        _context4.next = 12;
                                        break;

                                    case 9:
                                        _context4.prev = 9;
                                        _context4.t0 = _context4['catch'](3);

                                        allowed = false;

                                    case 12:
                                        return _context4.abrupt('return', new Promise(function (resolve, reject) {
                                            try {
                                                model = _this15.load(id);
                                            } catch (err) {
                                                console.log(err);
                                            }
                                            if (!allowed) {
                                                return reject("Access denied");
                                            }

                                            _this15.load(id).then(function (model) {
                                                return resolve(model);
                                            }).catch(function (err) {
                                                return reject(err);
                                            });
                                        }));

                                    case 13:
                                    case 'end':
                                        return _context4.stop();
                                }
                            }
                        }, _callee4, _this15, [[3, 9]]);
                    }));

                    function resolve(_x18, _x19, _x20) {
                        return _ref4.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _defineProperty(_ref7, this.modelName + 's', {

                type: new _graphql.GraphQLList(this.schema()),
                args: {
                    limit: {
                        type: _graphql.GraphQLInt,
                        defaultValue: 50
                    },
                    skip: {
                        type: _graphql.GraphQLInt,
                        defaultValue: 0
                    }

                },
                resolve: function () {
                    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(value, args, request) {
                        var allowed;
                        return regeneratorRuntime.wrap(function _callee5$(_context5) {
                            while (1) {
                                switch (_context5.prev = _context5.next) {
                                    case 0:
                                        allowed = false;
                                        _context5.prev = 1;
                                        _context5.next = 4;
                                        return _this15.checkPermission(request, 'find', null);

                                    case 4:
                                        allowed = _context5.sent;
                                        _context5.next = 10;
                                        break;

                                    case 7:
                                        _context5.prev = 7;
                                        _context5.t0 = _context5['catch'](1);

                                        allowed = false;

                                    case 10:
                                        return _context5.abrupt('return', new Promise(function (resolve, reject) {

                                            if (!allowed) {
                                                return reject("Access denied.");
                                            }

                                            var filter = {
                                                limit: _lodash2.default.get(args, 'limit', 50),
                                                skip: _lodash2.default.get(args, 'skip', 0)
                                            };

                                            _this15.find(null, filter).then(function (results) {

                                                return resolve(results);
                                            }).catch(function (err) {

                                                return reject(err);
                                            });
                                        }));

                                    case 11:
                                    case 'end':
                                        return _context5.stop();
                                }
                            }
                        }, _callee5, _this15, [[1, 7]]);
                    }));

                    function resolve(_x21, _x22, _x23) {
                        return _ref5.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _defineProperty(_ref7, 'count_' + this.modelName, {
                type: new _graphql.GraphQLObjectType({
                    name: this.modelName + '_count',
                    fields: function fields() {
                        return {
                            count: {
                                type: _graphql.GraphQLInt,
                                defaultValue: 0
                            }
                        };
                    }
                }),
                args: {},
                resolve: function () {
                    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(value, args, request) {
                        var allowed;
                        return regeneratorRuntime.wrap(function _callee6$(_context6) {
                            while (1) {
                                switch (_context6.prev = _context6.next) {
                                    case 0:
                                        allowed = false;
                                        _context6.prev = 1;
                                        _context6.next = 4;
                                        return _this15.checkPermission(request, 'count', null);

                                    case 4:
                                        allowed = _context6.sent;
                                        _context6.next = 10;
                                        break;

                                    case 7:
                                        _context6.prev = 7;
                                        _context6.t0 = _context6['catch'](1);

                                        allowed = false;

                                    case 10:
                                        return _context6.abrupt('return', new Promise(function (resolve, reject) {

                                            if (!allowed) {
                                                return reject("Access denied.");
                                            }
                                            _this15.count(null, null).then(function (results) {

                                                return resolve({ count: results });
                                            }).catch(function (err) {

                                                return reject(err);
                                            });
                                        }));

                                    case 11:
                                    case 'end':
                                        return _context6.stop();
                                }
                            }
                        }, _callee6, _this15, [[1, 7]]);
                    }));

                    function resolve(_x24, _x25, _x26) {
                        return _ref6.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _ref7;
        }

        /**
         * Mutations
         * @returns {{}}
         */

    }, {
        key: 'mutation',
        value: function mutation() {
            var _this16 = this,
                _ref11;

            var fields = this.fields();
            _lodash2.default.unset(fields, '_id');

            return _ref11 = {}, _defineProperty(_ref11, 'create_' + this.modelName, {
                type: this.schema(),
                args: fields,
                resolve: function () {
                    var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(root, args, request) {
                        var allowed;
                        return regeneratorRuntime.wrap(function _callee7$(_context7) {
                            while (1) {
                                switch (_context7.prev = _context7.next) {
                                    case 0:
                                        allowed = false;
                                        _context7.prev = 1;
                                        _context7.next = 4;
                                        return _this16.checkPermission(request, 'create', null);

                                    case 4:
                                        allowed = _context7.sent;
                                        _context7.next = 10;
                                        break;

                                    case 7:
                                        _context7.prev = 7;
                                        _context7.t0 = _context7['catch'](1);

                                        allowed = false;

                                    case 10:
                                        return _context7.abrupt('return', new Promise(function (resolve, reject) {

                                            if (!allowed) {
                                                return reject("Access denied.");
                                            }

                                            _this16.create(args).then(function (model) {

                                                return resolve(model);
                                            }).catch(function (err) {

                                                return reject(err);
                                            });
                                        }));

                                    case 11:
                                    case 'end':
                                        return _context7.stop();
                                }
                            }
                        }, _callee7, _this16, [[1, 7]]);
                    }));

                    function resolve(_x27, _x28, _x29) {
                        return _ref8.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _defineProperty(_ref11, 'update_' + this.modelName, {

                type: this.schema(),
                args: this.fields(),
                resolve: function () {
                    var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(value, args, request) {
                        var id, allowed;
                        return regeneratorRuntime.wrap(function _callee8$(_context8) {
                            while (1) {
                                switch (_context8.prev = _context8.next) {
                                    case 0:
                                        id = _lodash2.default.get(args, '_id');
                                        allowed = false;
                                        _context8.prev = 2;
                                        _context8.next = 5;
                                        return _this16.checkPermission(request, 'updateById', id);

                                    case 5:
                                        allowed = _context8.sent;
                                        _context8.next = 11;
                                        break;

                                    case 8:
                                        _context8.prev = 8;
                                        _context8.t0 = _context8['catch'](2);

                                        console.log(_context8.t0);

                                    case 11:
                                        return _context8.abrupt('return', new Promise(function (resolve, reject) {

                                            if (!allowed) {
                                                return reject('Access denied.');
                                            }

                                            _this16.update(id, args).then(function (model) {

                                                return resolve(model);
                                            }).catch(function (err) {
                                                return reject(err);
                                            });
                                        }));

                                    case 12:
                                    case 'end':
                                        return _context8.stop();
                                }
                            }
                        }, _callee8, _this16, [[2, 8]]);
                    }));

                    function resolve(_x30, _x31, _x32) {
                        return _ref9.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _defineProperty(_ref11, 'delete_' + this.modelName, {
                type: this.schema(),
                args: {
                    _id: {
                        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
                    }
                },
                resolve: function () {
                    var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(value, args, request) {
                        var id, allowed;
                        return regeneratorRuntime.wrap(function _callee9$(_context9) {
                            while (1) {
                                switch (_context9.prev = _context9.next) {
                                    case 0:
                                        id = _lodash2.default.get(args, '_id');
                                        allowed = false;
                                        _context9.prev = 2;
                                        _context9.next = 5;
                                        return _this16.checkPermission(request, 'deleteById', id);

                                    case 5:
                                        allowed = _context9.sent;
                                        _context9.next = 11;
                                        break;

                                    case 8:
                                        _context9.prev = 8;
                                        _context9.t0 = _context9['catch'](2);

                                        console.log(_context9.t0);

                                    case 11:
                                        return _context9.abrupt('return', new Promise(function (resolve, reject) {

                                            if (!allowed) {
                                                return reject("Access denied");
                                            }

                                            _this16.delete(id).then(function (data) {

                                                return resolve(data);
                                            }).catch(function (err) {
                                                return reject(err);
                                            });
                                        }));

                                    case 12:
                                    case 'end':
                                        return _context9.stop();
                                }
                            }
                        }, _callee9, _this16, [[2, 8]]);
                    }));

                    function resolve(_x33, _x34, _x35) {
                        return _ref10.apply(this, arguments);
                    }

                    return resolve;
                }()
            }), _ref11;
        }

        /**
         * Schema
         * @returns {null|GraphQLObjectType}
         */

    }, {
        key: 'schema',
        value: function schema() {
            var _this17 = this;

            if (this._schema) {
                return this._schema;
            }
            this._schema = new _graphql.GraphQLObjectType({
                name: this.modelName,
                description: '' + this.modelName,
                fields: function fields() {
                    return _this17.fields();
                }
            });

            return this._schema;
        }

        /**
         * Fields
         * @returns {null|*}
         */

    }, {
        key: 'fields',
        value: function fields() {

            if (this._fields) {
                return this._fields;
            }

            this._fields = {
                _id: { type: _graphql.GraphQLID }
            };

            return this._fields;
        }
    }]);

    return Model;
}();

exports.default = Model;
//# sourceMappingURL=model.js.map