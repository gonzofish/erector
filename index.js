'use strict';

const inquire = require('./inquire');
const base = process.cwd();

const build = (questions, files) => {
    const promise = inquire(questions);

    promise.then((answers) => construct(answers, files));

    return promise;
};

const construct = (answers, files) => {

};

module.exports = {
    build: build,
    construct: construct,
    inquire: inquire
};