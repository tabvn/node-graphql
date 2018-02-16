'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _graphql = require('graphql');

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _datetime = require('../types/datetime');

var _datetime2 = _interopRequireDefault(_datetime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Token = function (_Model) {
    _inherits(Token, _Model);

    function Token(app) {
        _classCallCheck(this, Token);

        return _possibleConstructorReturn(this, (Token.__proto__ || Object.getPrototypeOf(Token)).call(this, app, 'token'));
    }

    /**
     *
     * @returns {{_id: {type}, created: {type, defaultValue: Date}, updated: {type, defaultValue: null}}}
     */


    _createClass(Token, [{
        key: 'fields',
        value: function fields() {
            return {
                _id: { type: _graphql.GraphQLID },
                userId: {
                    type: (0, _graphql.GraphQLNonNull)(_graphql.GraphQLString),
                    objectId: true,
                    required: true
                },
                created: {
                    type: _datetime2.default,
                    defaultValue: new Date()
                }
            };
        }
    }]);

    return Token;
}(_model2.default);

exports.default = Token;
//# sourceMappingURL=token.js.map