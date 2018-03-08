import {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLList,
    GraphQLID,
} from 'graphql';
import {ObjectID} from 'mongodb'
import bcrypt from 'bcrypt'
import _ from 'lodash'
import {Map} from 'immutable'
import 'babel-polyfill'

export default class Model {

    constructor(ctx, name) {
        this.ctx = ctx;
        this.modelName = name;
        this.collection = this.ctx.db.collection(name);

        this._schema = null;
        this._fields = null;
        this.cache = new Map();

        this.modelDidLoad();
    }

    modelDidLoad() {

    }

    /**
     * Create object Id
     * @param id
     * @returns {*}
     */
    objectId(id) {


        if (typeof id !== 'string') {

            return id;
        }

        try {

            id = new ObjectID(id);

        }
        catch (err) {

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
    findOne(query, options = null) {

        return new Promise((resolve, reject) => {

            this.collection.findOne(query, options, (err, result) => {
                return err ? reject(err) : resolve(result);
            });
        })
    }

    /**
     * Find model
     * @param query
     * @param filter
     * @returns {Promise<any>}
     */
    find(query = {}, filter = {}) {

        return new Promise((resolve, reject) => {

            this.collection.find(query).limit(_.get(filter, 'limit', 50)).skip(_.get(filter, 'skip', 0)).sort({created: -1}).toArray((err, results) => {

                return err ? reject(err) : resolve(results);
            });

        });


    }

    /**
     * Get model in cache by String ID
     * @param id
     * @returns {V | undefined}
     */
    cacheGet(id) {

        if ((typeof id) !== "string") {
            id = _.toString(id)
        }


        return this.cache.get(id);

    }

    /**
     * Save Model to cache
     * @param id
     * @param model
     */
    cacheSet(id, model) {

        if (typeof id !== "string") {
            id = _.toString(id)
        }

        this.cache = this.cache.set(id, model)
    }

    /**
     * Remove model from cache
     * @param id
     */
    cacheRemove(id) {
        if (typeof id !== "string") {
            id = _.toString(id)
        }
        this.cache = this.cache.remove(id);

    }

    /**
     * Clear cache
     */
    clearCache() {

        this.cache = this.cache.clear();
    }

    count(query, options = null) {

        return new Promise((resolve, reject) => {

            this.collection.count(query, options, (err, result) => {
                return err ? reject(err) : resolve(result ? result : 0);
            })
        })
    }

    /**
     * Get model
     * @param id
     * @returns {Promise<any>}
     */
    load(id) {

        return new Promise((resolve, reject) => {

            const cache = this.cacheGet(id);
            if (cache) {
                return resolve(cache);
            }
            if (!ObjectID.isValid(id)) {
                return reject("Invalid ID");
            }

            id = this.objectId(id);


            this.collection.findOne({_id: id}, (err, model) => {

                if (err === null && model) {
                    this.cacheSet(id, model);
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
    aggregate(query) {

        return new Promise((resolve, reject) => {

            this.collection.aggregate(query, {allowDiskUse: true}, (err, result) => {

                if (err) {
                    return reject(err);
                }
                result.toArray((err, results) => {

                    return err ? reject(err) : resolve(results);
                })
            });

        })
    }

    /**
     * Validate email address
     * @param email
     * @returns {boolean}
     */
    isEmail(email = "") {

        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return regex.test(email);
    }

    /**
     * Validate model before save
     * @returns {Promise<any>}
     */
    async validate(id = null, model) {

        const fields = this.fields();
        let uniqueFields = [];
        let data = {};
        let passwordFields = [];
        let errors = [];

        _.each(fields, (field, fieldName) => {

            const isRequired = _.get(field, 'required', false);
            let value = _.get(model, fieldName);
            const isEmail = _.get(field, 'email', false);
            const isUnique = _.get(field, 'unique', false);
            const isPassword = _.get(field, 'password', false);
            const isObjectId = _.get(field, 'objectId', false);
            const isMinLength = _.get(field, 'minLength', 0);
            const isLowercase = _.get(field, 'lowercase', false);

            data[fieldName] = _.get(model, fieldName, _.get(field, 'defaultValue'));
            if (isEmail) {
                data[fieldName] = _.toLower(_.get(data, fieldName));
            }
            if (isLowercase) {
                data[fieldName] = _.toLower(_.get(data, fieldName));
            }

            if (isUnique) {
                uniqueFields.push({name: fieldName, value: value});
            }
            if (isEmail && !this.isEmail(value)) {
                errors.push(`${fieldName} must be an email format.`)
            }
            if (isRequired && (!value && value === "")) {
                if (!isPassword && id !== null) {
                    errors.push(`${fieldName} is required.`);
                }

            }
            if (!isPassword && isMinLength && value.length < isMinLength) {
                errors.push(`${fieldName} must greater than ${isMinLength} characters.`);
            }
            if (isPassword) {
                passwordFields.push({name: fieldName, value: value});
            }
            if (isPassword && id === null && (!value || value === "" || value.length < isMinLength)) {
                errors.push(`${fieldName} must greater than ${isMinLength} characters.`);
            }
            if (isPassword && value && value !== "" && value.length >= isMinLength) {
                data[fieldName] = bcrypt.hashSync(_.get(data, fieldName), 10);
            }

            if (isObjectId) {
                if (Array.isArray(value)) {

                    _.each(value, (v, index) => {

                        value[index] = _.toString(v);
                    });

                    value = _.uniq(value);

                    let objectIds = [];

                    _.each(value, (v) => {
                        if (!ObjectID.isValid(v)) {
                            errors.push(`${fieldName} is invalid`);
                        }
                        objectIds.push(this.objectId(v));
                    });

                    data[fieldName] = objectIds;

                } else {
                    if (!ObjectID.isValid(value)) {

                        errors.push(`${fieldName} is invalid`);
                    }

                    data[fieldName] = this.objectId(value);
                }
            }
        });


        if (passwordFields.length && id) {
            const originalModel = await this.load(id);
            _.each(passwordFields, (field) => {
                const originPassword = _.get(originalModel, field.name);
                if (!field.value || field.value === "" || field.value === originPassword || bcrypt.compareSync(field.value, originPassword)) {
                    data[field.name] = originPassword;
                }

            });
        }

        if (!id) {
            _.unset(data, '_id');
        }

        return new Promise((resolve, reject) => {


            if (errors.length) {
                return reject(errors);
            }
            if (uniqueFields.length) {

                let uniqueFieldNames = [];

                let orQuery = [];

                _.each(uniqueFields, (f) => {
                    const fieldName = f.name;
                    const fieldValue = _.toLower(_.trim(f.value));

                    let subQuery = {};

                    subQuery[fieldName] = {$eq: fieldValue};
                    orQuery.push(subQuery);
                    uniqueFieldNames.push(f.name);

                });


                let query = {
                    $and: [],
                };

                query.$and.push({$or: orQuery});

                if (id) {
                    query.$and.push({_id: {$ne: this.objectId(id)}});

                }
                this.findOne(query, null).then((result) => {

                    if (result !== null) {

                        let validateError = null;

                        if (uniqueFieldNames.length) {
                            validateError = `${_.join(uniqueFieldNames, ', ')} is already used please choose another one.`;
                        }
                        return reject(validateError);
                    }

                    resolve(data);

                }).catch((err) => {

                    return reject(err);

                });


            } else {
                return resolve(data)
            }


        });

    }

    /**
     * Event before model is create
     * @param model
     * @returns {Promise<any>}
     */
    beforeCreate(model) {
        return new Promise((resolve, reject) => {
            return resolve(model);
        });
    }

    /**
     * Create model
     * @param model
     * @returns {Promise<any>}
     */
    create(model = {}) {

        return new Promise((resolve, reject) => {

            this.validate(null, model).then((model) => {

                this.beforeCreate(model).then((model) => {

                    this.collection.insertOne(model, (err, info) => {

                        if (!err) {
                            this.cacheSet(_.get(model, '_id'), model);

                            this.afterCreate(model).then((model) => {

                            });
                        }
                        return err ? reject(err) : resolve(model);
                    });

                }).catch((err) => {
                    return reject(err);
                });


            }).catch((err) => {

                return reject(err);
            });


        });
    }

    /**
     * Event will fired after model is created.
     * @param model
     * @returns {Promise<any>}
     */
    afterCreate(model) {
        return new Promise((resolve, reject) => {

            const payload = {
                event: 'model_added',
                modelName: this.modelName,
                model: model,
            };

            this.notification(payload).then(() => {

            });

            return resolve(model);


        });
    }


    /**
     * Before update model
     * @param id
     * @param model
     * @returns {Promise<any>}
     */
    beforeUpdate(id, model) {

        return new Promise((resolve, reject) => {

            return resolve(model);
        })
    }

    /**
     * After model is updated
     * @param id
     * @param model
     * @returns {Promise<any>}
     */
    afterUpdate(id, model) {

        return new Promise((resolve, reject) => {

            const payload = {
                event: 'model_updated',
                modelName: this.modelName,
                model: model
            };

            this.notification(payload).then(() => {

            });

            return resolve(model);
        });
    }

    /**
     *
     * @param payload
     * @returns {Promise<any>}
     */

    notification(payload) {
        return new Promise((resolve, reject) => {
            return resolve(payload);
        })
    }

    /**
     * Update model attribute
     * @param id
     * @param attr
     * @returns {Promise<any>}
     */
    async updateAttribute(id, attr) {

        let model = await this.load(id);

        _.each(attr, (value, key) => {
            model = _.setWith(model, key, value);
        });
        return this.update(id, model);

    }

    /**
     * Update model
     * @param id
     * @param model
     * @returns {Promise<any>}
     */
    update(id = null, model) {

        return new Promise((resolve, reject) => {
            if (!id || !ObjectID.isValid(id)) {
                return reject("Invalid ID");
            }
            this.validate(id, model).then((model) => {

                const fields = this.fields();

                id = this.objectId(id);

                const query = {
                    _id: id
                };

                if (_.get(fields, 'updated')) {
                    model = _.setWith(model, 'updated', new Date());
                }
                model = _.setWith(model, '_id', id);


                this.beforeUpdate(id, model).then((model) => {
                    this.collection.updateOne(query, {$set: model}, (err, result) => {
                        if (err || !_.get(result, 'matchedCount')) {
                            return reject(err ? err : 'Model not found');
                        }

                        this.afterUpdate(id, model).then(() => {

                        });

                        this.cacheSet(id, model);

                        return resolve(model);

                    });

                }).catch((err) => {
                    return reject(err);
                });


            }).catch((err) => {
                return reject(err);
            })

        });
    }

    /**
     * Before delete model
     * @param id
     * @returns {Promise<any>}
     */
    beforeDelete(id) {

        return new Promise((resolve, reject) => {
            return resolve(id);
        })
    }

    /**
     * After model is deleted
     * @param id
     * @returns {Promise<any>}
     */
    afterDelete(id) {

        return new Promise((resolve, reject) => {
            const payload = {
                event: 'model_deleted',
                modelName: this.modelName,
                model: null,
                id: id,
            };

            this.notification(payload).then(() => {
            });

            return resolve(id);
        });
    }

    /**
     * Delete model
     * @param id
     * @returns {Promise<any>}
     */
    delete(id) {

        return new Promise((resolve, reject) => {

            if (!id || !ObjectID.isValid(id)) {
                return reject("Invalid ID");
            }

            id = this.objectId(id);

            this.beforeDelete(id).then(() => {
                this.cacheRemove(id);

                this.collection.deleteOne({_id: id}, (err, result) => {

                    if (err === null) {

                        this.afterDelete(id).then(() => {

                        });
                    }
                    return err ? reject(err) : resolve({
                        _id: id
                    });


                });

            }).catch((err) => {

                return reject(err);
            });


        })
    }



    /**
     * permission
     */
    permissions() {

        return [
            {
                accessType: '*',
                role: 'everyone',
                permission: 'DENY'
            },
            {
                accessType: '*',
                role: 'administrator',
                permission: 'ALLOW'
            },
            {
                accessType: 'findById',
                role: 'owner',
                permission: 'ALLOW'
            },
            {
                accessType: 'updateById',
                role: 'owner',
                permission: 'ALLOW'
            },
        ];
    }

    /**
     * Check model permission
     * @param req
     * @param accessType
     * @param id
     */
    checkPermission(req, accessType = '*', id = null) {


        return new Promise((resolve, reject) => {

            this.ctx.models.user.getUserRolesFromRequest(req).then((roles) => {


                this.roleRegister(req, accessType, id).then((dynamicRoles) => {
                    roles = roles.concat(dynamicRoles);

                    this.checkPermissionByRoles(roles, accessType).then(() => {

                        return resolve(true);

                    }).catch((err) => {
                        return reject(err);
                    })


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
    checkPermissionByRoles(roles = [], accessType = '*') {


        let isAllowed = true;
        const permissions = this.permissions();


        _.each(roles, (role) => {

            _.each(permissions, (perm) => {
                const accessTypeRule = _.get(perm, 'accessType');

                if ((accessTypeRule === '*' || accessTypeRule === accessType) && role === _.get(perm, 'role') && _.get(perm, 'permission') === 'ALLOW') {
                    isAllowed = true;
                }
                if ((accessTypeRule === '*' || accessTypeRule === accessType) && role === _.get(perm, 'role') && _.get(perm, 'permission') === 'DENY') {
                    isAllowed = false;
                }

            });
        });

        return new Promise((resolve, reject) => {
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
    async roleRegister(req, accessType = '', id = null) {


        const userId = _.get(req, 'token.userId');
        let model = null;

        if (id) {
            try {
                model = await this.load(id);
            }
            catch (err) {
                console.log(err);
            }
        }

        return new Promise((resolve, reject) => {

            if (!id || !userId || !ObjectID.isValid(id) || !ObjectID.isValid(userId)) {
                return resolve([]);
            }

            if (accessType === 'findById' || accessType === 'updateById' || accessType === 'deleteById' && (userId && id)) {

                if (this.modelName === 'user') {


                    if (_.toString(_.get(model, '_id')) === _.toString(userId)) {
                        return resolve(['owner']);
                    }

                } else {
                    if (_.toString(_.get(model, 'userId')) === _.toString(userId)) {

                        return resolve(['owner'])
                    }
                }
                return resolve([]);
            }
            else {
                return resolve([]);
            }
        });

    }


    /**
     * Queries
     * @returns {{}}
     */
    query() {

        return {
            [this.modelName]: {
                type: this.schema(),
                args: {
                    _id: {
                        type: GraphQLID
                    }
                },
                resolve: async (value, args, request) => {

                    const id = _.get(args, '_id');
                    let model = null;
                    let allowed = false;
                    try {
                        allowed = await this.checkPermission(request, 'findById', id);
                    }
                    catch (err) {
                        allowed = false;
                    }

                    return new Promise((resolve, reject) => {
                        try {
                            model = this.load(id);
                        } catch (err) {
                            console.log(err);
                        }
                        if (!allowed) {
                            return reject("Access denied");
                        }

                        this.load(id).then((model) => {
                            return resolve(model);
                        }).catch((err) => reject(err));

                    });


                }
            },
            [`${this.modelName}s`]: {

                type: new GraphQLList(this.schema()),
                args: {
                    limit: {
                        type: GraphQLInt,
                        defaultValue: 50,
                    },
                    skip: {
                        type: GraphQLInt,
                        defaultValue: 0,
                    },

                },
                resolve: async (value, args, request) => {

                    let allowed = false;
                    try {
                        allowed = await this.checkPermission(request, 'find', null);
                    }
                    catch (err) {
                        allowed = false;
                    }

                    return new Promise((resolve, reject) => {

                        if (!allowed) {
                            return reject("Access denied.");
                        }


                        const filter = {
                            limit: _.get(args, 'limit', 50),
                            skip: _.get(args, 'skip', 0),
                        };

                        this.find(null, filter).then((results) => {

                            return resolve(results);
                        }).catch((err) => {

                            return reject(err);
                        });

                    });


                }
            },
            [`count_${this.modelName}`]: {
                type: new GraphQLObjectType({
                    name: `${this.modelName}_count`,
                    fields: () => ({
                        count: {
                            type: GraphQLInt,
                            defaultValue: 0,
                        }
                    })
                }),
                args: {},
                resolve: async (value, args, request) => {

                    let allowed = false;
                    try {
                        allowed = await this.checkPermission(request, 'count', null);
                    }
                    catch (err) {
                        allowed = false;
                    }

                    return new Promise((resolve, reject) => {

                        if (!allowed) {
                            return reject("Access denied.");
                        }
                        this.count(null, null).then((results) => {

                            return resolve({count: results});
                        }).catch((err) => {

                            return reject(err);
                        });

                    });


                }
            }

        }
    }


    /**
     * Mutations
     * @returns {{}}
     */
    mutation() {

        let fields = this.fields();
        _.unset(fields, '_id');

        return {
            [`create_${this.modelName}`]: {
                type: this.schema(),
                args: fields,
                resolve: async (root, args, request) => {

                    let allowed = false;
                    try {
                        allowed = await this.checkPermission(request, 'create', null);
                    }
                    catch (err) {
                        allowed = false;
                    }
                    return new Promise((resolve, reject) => {

                        if (!allowed) {
                            return reject("Access denied.");
                        }

                        this.create(args).then((model) => {

                            return resolve(model)
                        }).catch((err) => {

                            return reject(err);
                        })
                    });

                }
            },
            [`update_${this.modelName}`]: {

                type: this.schema(),
                args: this.fields(),
                resolve: async (value, args, request) => {

                    const id = _.get(args, '_id');
                    let allowed = false;
                    try {
                        allowed = await this.checkPermission(request, 'updateById', id);
                    }
                    catch (err) {
                        console.log(err);
                    }

                    return new Promise((resolve, reject) => {

                        if (!allowed) {
                            return reject('Access denied.');
                        }

                        this.update(id, args).then((model) => {

                            return resolve(model);
                        }).catch((err) => reject(err));
                    });

                }
            },

            [`delete_${this.modelName}`]: {
                type: this.schema(),
                args: {
                    _id: {
                        type: new GraphQLNonNull(GraphQLID)
                    },
                },
                resolve: async (value, args, request) => {

                    const id = _.get(args, '_id');
                    let allowed = false;

                    try {
                        allowed = await this.checkPermission(request, 'deleteById', id);
                    }
                    catch (err) {
                        console.log(err);
                    }

                    return new Promise((resolve, reject) => {

                        if (!allowed) {
                            return reject("Access denied");
                        }

                        this.delete(id).then((data) => {

                            return resolve(data);
                        }).catch((err) => {
                            return reject(err);
                        });
                    });


                }
            }

        }
    }

    /**
     * Schema
     * @returns {null|GraphQLObjectType}
     */
    schema() {

        if (this._schema) {
            return this._schema;
        }
        this._schema = new GraphQLObjectType({
            name: this.modelName,
            description: `${this.modelName}`,
            fields: () => (this.fields())
        });

        return this._schema;
    }

    /**
     * Fields
     * @returns {null|*}
     */
    fields() {

        if (this._fields) {
            return this._fields;
        }

        this._fields = {
            _id: {type: GraphQLID},
        };

        return this._fields;

    }

}