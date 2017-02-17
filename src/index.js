'use strict';

const construct = require('./construct');
const inquire = require('./inquire');
const updaters = require('./updaters');

const build = (questions, templates) => {
    const promise = inquire(questions);

    promise.then((answers) => {
        construct(answers, templates);
    });

    return promise;
};

module.exports = {
    build: build,
    construct: construct,
    inquire: inquire,
    updaters: updaters
};