'use strict';

const path = require('path');
const merge = require('./merge');
const typeCheck = require('./type-check');

const getAnswersPath = () => {
  return `${process.cwd()}${path.sep}.erector`;
};

module.exports = {
    checkIsType: typeCheck.checkIsType,
    copyValue: merge.copyValue,
    getType: typeCheck.getType,
    getAnswersPath: getAnswersPath,
    mergeDeep: merge.mergeDeep
};
