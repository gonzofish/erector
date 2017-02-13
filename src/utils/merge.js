'use strict';

const typeCheck = require('./type-check');

const mergeDeep = (target, source) => {
  const type = typeCheck.getType(target);

  switch (type) {
    case 'array':
      return mergeArray(target, source);
    case 'object':
      return mergeObject(target, source);
    default:
      return source;
  }
};

const mergeArray = (target, source) => {
  const sourceCopy = copyValue(source);
  const targetCopy = copyValue(target);

  return targetCopy.concat(sourceCopy);
};

const mergeObject = (target, source) => {
  const targetCopy = copyValue(target);

  return Object.keys(source).reduce((result, key) => {
    if (result[key]) {
      result[key] = mergeDeep(result[key], source[key]);
    } else {
      result[key] = copyValue(source[key]);
    }

    return result;
  }, targetCopy);
};

const copyValue = (value) => {
  const type = typeCheck.getType(value);

  switch (type) {
    case 'array':
      return copyArray(value);
    case 'date':
      return copyDate(value);
    case 'object':
      return copyObject(value);
    default:
      return value;
  }
};

const copyArray = (list) => list.map((value) => copyValue(value));
const copyDate = (oldDate) => new Date(oldDate);
const copyObject = (value) => Object.keys(value).reduce((obj, key) => {
    obj[key] = copyValue(value[key]);
    return obj;
}, {});

module.exports = {
    copyValue: copyValue,
    mergeDeep: mergeDeep
};