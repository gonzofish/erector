'use strict';

const inquire = require('./inquire');
const base = process.cwd();

const gather = (questions, files) => {
    const promise = inquire(questions);

    promise.then((answers) => build(answers, files));

    return promise;
};

const build = (answers, files) => {

};

module.exports = {
    build: build,
    gather: gather
};