"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _user = require("./user");

var _user2 = _interopRequireDefault(_user);

var _token = require("./token");

var _token2 = _interopRequireDefault(_token);

var _role = require("./role");

var _role2 = _interopRequireDefault(_role);

var _user_role = require("./user_role");

var _user_role2 = _interopRequireDefault(_user_role);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Models = function () {
    function Models(ctx) {
        _classCallCheck(this, Models);

        this._models = {
            user: new _user2.default(ctx),
            token: new _token2.default(ctx),
            role: new _role2.default(ctx),
            user_role: new _user_role2.default(ctx)
        };
    }

    _createClass(Models, [{
        key: "getModels",
        value: function getModels() {

            return this._models;
        }
    }]);

    return Models;
}();

exports.default = Models;
//# sourceMappingURL=index.js.map