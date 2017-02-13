'use strict';

const utils = require('../utils');

module.exports = (existing, replacement) => {
    const existJson = JSON.parse(existing);
    const replaceJson = JSON.parse(replacement);
    const merged = utils.mergeDeep(existJson, replaceJson);

    return JSON.stringify(merged, null, 2);
};