'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// List of API methods that should be prevented in read-only mode
const dangerousMethods = ['mkdir', 'rename', 'rmdir', 'unlink', 'writeFile', 'createWriteStream'];

/**
 * Create a read-only fs-like API for Dropbox
 *
 * @param {{
 *  apiKey: String,
 *  client: Dropbox,
 * }} Configuration object
 * @returns {Object}
 */

exports.default = ({ client, apiKey }) => {
    const api = (0, _index2.default)({ client, apiKey });

    const returnError = method => (...methodArgs) => {
        const cb = methodArgs[methodArgs.length - 1];
        cb(`${method} is not supported in read-only mode`);
    };

    // Replace dangerous methods with safe ones
    dangerousMethods.forEach(method => {
        api[method] = returnError(method);
    });

    return api;
};

module.exports = exports['default'];