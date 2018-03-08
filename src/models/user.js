import {
    GraphQLString,
    GraphQLNonNull,
    GraphQLID,
    GraphQLBoolean,
    GraphQLObjectType,
    GraphQLList,
} from 'graphql';
import Model from './model'
import DateTime from '../types/datetime'
import Email from '../types/email'
import _ from 'lodash'
import bcrypt from 'bcrypt'
import {Map} from 'immutable'
import {ObjectID} from 'mongodb'

export default class User extends Model {

    constructor(ctx) {

        super(ctx, 'user');
        this.userRoles = new Map();

    }

    /**
     * Event before model is delete
     * @param id
     * @returns {Promise<any>}
     */
    beforeDelete(id) {

        return new Promise((resolve, reject) => {

            super.beforeDelete(id).then(id => {


                const relations = [
                    this.ctx.models.token,
                    this.ctx.models.user_role
                ];

                _.each(relations, (relation) => {

                    relation.find({userId: id}).then((results) => {

                        _.each(results, (result) => {

                            relation.delete(_.get(result, '_id')).then(() => {

                            });
                        })

                    });

                });


                return resolve(id);

            }).catch((err) => {
                return reject(err);
            })
        })
    }

    /**
     * Create default user
     */


    /**
     * Get user roles name array
     * @param id
     * @returns {Promise<any>}
     */
    getUserRoles(id) {

        return new Promise((resolve, reject) => {

            if (!id || !ObjectID.isValid(id)) {
                return reject("Invalid user Id")
            }

            // find in cache
            let roles = this.userRoles.get(_.toString(id));
            if (roles && roles.length) {
                return resolve(roles);
            }

            const userId = this.objectId(id);


            let query = [

                {
                    $lookup: {
                        from: this.ctx.models.user_role.modelName,
                        localField: '_id',
                        foreignField: 'roleId',
                        as: 'user_role'
                    },
                },
                {$unwind: {path: "$user_role", preserveNullAndEmptyArrays: true}},
                {
                    $match: {
                        "user_role.userId": {$eq: userId}
                    }
                },
                {
                    $project: {
                        _id: false,
                        name: "$name"
                    }
                }


            ];


            this.ctx.models.role.aggregate(query).then((results) => {

                let roles = [];

                _.each(results, (result) => {
                    roles.push(result.name);
                });
                // save cache
                this.userRoles = this.userRoles.set(_.toString(id), roles);

                return resolve(roles);

            }).catch(err => reject(err));


        })

    }

    /**
     * Get user role from request.
     * @param req
     * @param cb
     * @returns {Promise<any>}
     */
    getUserRolesFromRequest(req) {

        const userId = _.get(req, 'token.userId');


        let roles = ['everyone'];


        return new Promise((resolve, reject) => {
            if (!userId) {
                return resolve(roles);
            }
            roles.push('authenticated');

            this.getUserRoles(userId).then((results) => {

                if (results && results.length) {
                    roles = roles.concat(results);
                }


                return resolve(roles);

            }).catch((err) => {

                return reject(err);
            })

        });


    }

    /**
     * Login user
     * @param email
     * @param password
     * @returns {Promise<any>}
     */
    login(email, password) {

        return new Promise((resolve, reject) => {
            if (!email || !this.isEmail(email)) {
                return reject("Invalid Email");
            }
            if (!password || password === "") {
                return reject("Password is required");
            }

            email = _.toLower(email);
            this.findOne({email: email}).then((model) => {

                if (model === null) {
                    return reject("Login Error");
                }
                const originalPassword = _.get(model, 'password');
                const isMatched = bcrypt.compareSync(password, originalPassword);
                if (isMatched) {

                    this.ctx.models.token.create({
                        userId: _.get(model, '_id'),
                        created: new Date(),
                    }).then((token) => {
                        token = _.setWith(token, 'user', model);

                        return resolve(token);

                    }).catch((err) => {
                        return reject(err);
                    });

                } else {
                    return reject("Password does not match.");
                }


            }).catch((err) => {

                return reject('Login Error');
            })
        });
    }

    /**
     *
     * @returns {{_id: {type}, firstName: {type}, lastName: {type}, email: {type, unique: boolean, email: boolean, required: boolean}, password: {type, password: boolean, required: boolean, minLength: number}, active: {type, defaultValue: boolean}, created: {type, defaultValue: Date}}}
     */
    fields() {
        return {
            _id: {type: GraphQLID},
            firstName: {type: new GraphQLNonNull(GraphQLString)},
            lastName: {type: new GraphQLNonNull(GraphQLString)},
            email: {type: Email, unique: true, email: true, required: true},
            password: {type: GraphQLString, password: true, required: true, minLength: 3},
            active: {type: GraphQLBoolean, defaultValue: true},
            online: {
                type: GraphQLBoolean,
                defaultValue: false,
            },
            created: {
                type: DateTime,
                defaultValue: new Date(),
            },
            updated: {
                type: DateTime,
                defaultValue: null,
            }
        }
    }

    query() {

        const parentQuery = super.query();

        const query = {
            me: {
                type: this.schema(),
                args: {},
                resolve: (value, args, request) => {
                    const userId = _.get(request, 'token.userId');

                    return new Promise((resolve, reject) => {

                        this.load(userId).then((user) => {
                            return resolve(user);
                        }).catch(() => {
                            return reject("Access denied");
                        });

                    });


                }
            },
            roleOwner: {
                type: new GraphQLList(GraphQLString),
                args: {
                    _id: {
                        type: GraphQLNonNull(GraphQLString),
                    }
                },
                resolve: (value, args, request) => {

                    return new Promise((resolve, reject) => {

                        const userId = _.get(args, '_id');

                        return this.getUserRoles(userId).then((roles) => {
                            return resolve(roles);
                        }).catch((err) => {
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
    mutation() {

        const parentMutation = super.mutation();

        const mutation = {
            login: {
                type: new GraphQLObjectType({
                    name: 'login',
                    fields: () => (Object.assign(this.ctx.models.token.fields(), {
                        user: {
                            type: this.schema(),
                        }
                    }))
                }),
                args: {
                    email: {
                        name: 'email',
                        type: GraphQLNonNull(Email),
                    },
                    password: {
                        name: 'password',
                        type: GraphQLNonNull(GraphQLString),
                    }
                },
                resolve: (value, args, request) => {


                    return this.login(_.get(args, 'email'), _.get(args, 'password'));
                }
            },
            logout: {

                type: new GraphQLObjectType({
                    name: 'logout',
                    fields: () => ({
                        success: {
                            type: GraphQLBoolean,
                            defaultValue: true,
                        }
                    })
                }),
                args: {
                    token: {
                        name: 'token',
                        type: GraphQLNonNull(GraphQLString),
                    }
                },
                resolve: (value, args, request) => {

                    return new Promise((resolve, reject) => {

                        const token = _.get(args, 'token');
                        this.ctx.models.token.deleteToken(token).then(() => {

                            return resolve({
                                success: true,
                            });

                        }).catch((err) => {
                            return reject(err);
                        })

                    });

                }
            },
            updateUserRoles: {
                type: new GraphQLObjectType({
                    name: 'user_roles',
                    fields: () => (
                        {
                            roles: {
                                type: new GraphQLList(GraphQLString),
                                defaultValue: [],
                            }
                        }
                    )
                }),
                args: {
                    roles: {
                        type: GraphQLList(GraphQLString),
                        defaultValue: [],
                    },
                    _id: {
                        type: GraphQLNonNull(GraphQLString),
                    }
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

                        let roleNames = _.get(args, 'roles', []);
                        const userId = this.objectId(_.get(args, '_id'));

                        roleNames = _.uniq(roleNames);

                        let user_roles = [];

                        if (roleNames.length) {
                            this.ctx.models.role.find({name: {$in: roleNames}}).then((roles) => {


                                _.each(roles, (role) => {

                                    user_roles.push(({
                                        userId: userId,
                                        roleId: role._id,
                                    }));
                                });

                                this.ctx.models.user_role.collection.deleteMany({userId: userId}, (err, info) => {
                                    this.ctx.models.user_role.collection.insertMany(user_roles, (err, info) => {


                                        if (err) {
                                            return reject(err);
                                        }
                                        this.userRoles = this.userRoles.set(_.get(args, '_id'), roleNames);
                                        return resolve({roles: roleNames});

                                    });
                                })

                                // console.log(roles);

                            }).catch((err) => {
                                return reject(err);
                            })
                        } else {

                            this.ctx.models.user_role.collection.deleteMany({userId: userId}, (err, info) => {
                                this.userRoles = this.userRoles.set(_.get(args, '_id'), []);
                                return err ? reject(err) : resolve({roles: []});
                            })

                        }


                    });
                }
            }
        };

        return Object.assign(parentMutation, mutation);
    }

}