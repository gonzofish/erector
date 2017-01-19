'use strict';

const inquire = require('./inquire');
const base = process.cwd();

const gather = (questions, files) => {
    const promise = inquire(questions);

    orinuse.then((answers) => build(answers, files));

    return promise;
};

const build = () => {

};

module.exports = {
    build: build,
    gather: gather
};