'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _db = require('./db');

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _realtime = require('./realtime');

var _realtime2 = _interopRequireDefault(_realtime);

var _uws = require('uws');

var _uws2 = _interopRequireDefault(_uws);

var _config = require('./config');

var _boot = require('./boot');

var _boot2 = _interopRequireDefault(_boot);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var PORT = _config.appPort;

var app = (0, _express2.default)();
app.server = _http2.default.createServer(app);

app.use((0, _cors2.default)({
    exposedHeaders: "*"
}));

app.wss = new _uws2.default.Server({
    server: app.server
});

var ctx = {};

(0, _db.connect)().then(function (db) {
    ctx.db = db;
    ctx.models = new _models2.default(ctx).getModels();
    ctx.wss = app.wss;
    ctx.realtime = new _realtime2.default(ctx);

    (0, _boot2.default)(ctx);
}).catch(function (err) {
    throw err;
});

app.ctx = ctx;

var handleRequest = (0, _expressGraphql2.default)(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(request) {
        var tokenId, token;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        tokenId = request.header('authorization');

                        if (!tokenId) {
                            tokenId = _lodash2.default.get(request, 'query.auth', null);
                        }

                        request.ctx = ctx;
                        token = null;

                        if (!tokenId) {
                            _context.next = 14;
                            break;
                        }

                        _context.prev = 5;
                        _context.next = 8;
                        return ctx.models.token.load(tokenId);

                    case 8:
                        token = _context.sent;
                        _context.next = 14;
                        break;

                    case 11:
                        _context.prev = 11;
                        _context.t0 = _context['catch'](5);

                        token = null;

                    case 14:

                        request.token = token;

                        return _context.abrupt('return', {
                            schema: new _schema2.default(ctx).schema(),
                            graphiql: _config.production ? false : true
                        });

                    case 16:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[5, 11]]);
    }));

    return function (_x) {
        return _ref.apply(this, arguments);
    };
}());

app.use('/api', handleRequest);
app.use('/', _express2.default.static(_path2.default.join(__dirname, 'public')));

app.server.listen(PORT, function () {
    console.log('App is running on port ' + app.server.address().port);
});
//# sourceMappingURL=index.js.map