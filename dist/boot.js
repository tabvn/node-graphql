'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _config = require('./config');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (ctx) {

    var role = ctx.models.role;
    var user = ctx.models.user;

    // create default role
    role.findOne({ name: 'administrator' }).then(function (model) {

        if (model === null) {
            // create default administrator role
            role.create({ name: 'administrator' }).then(function (roleModel) {

                user.findOne({ email: _config.rootUser.email }, null).then(function (userModel) {
                    if (userModel === null) {
                        // let create default user
                        user.collection.insertOne(_config.rootUser, function (err, info) {

                            if (err) {
                                console.log(err);
                            } else {
                                ctx.models.user_role.create({
                                    userId: _config.rootUser._id,
                                    roleId: roleModel._id
                                }).then(function () {
                                    user.cacheSet(_lodash2.default.get(_config.rootUser._id), _config.rootUser);
                                });
                            }
                        });
                    }
                }).catch(function (err) {
                    console.log("An error create default user", err);
                });
            }).catch(function (err) {
                console.log("An error create default role", err);
            });
        }
    });
};
//# sourceMappingURL=boot.js.map