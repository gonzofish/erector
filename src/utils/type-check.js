'use strict';

const checkIsType = (value, type) => getType(value) === type.toLowerCase();

const getType = (value) =>
  Object.prototype.toString.call(value)
    .toLowerCase()
    .slice(8, -1);

module.exports = {
    checkIsType: checkIsType,
    getType: getType
};
