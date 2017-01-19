'use strict';

// const erectorSet = reqiure('erector-set');
const erectorSet = require('../../index');
const questions = require('../questions');

const templates = [
    { destination: __dirname + '/outputs/animal-story.txt', template: 'My favorite food is {{ food }} (id: {{ foodId }})\n{{ yesNo }}' },
    { destination: __dirname + '/outputs/from-template.txt', template: __dirname + '/templates/template.txt' },
    { destination: __dirname + '/outputs/sub/{{ food }}-file' }
];

// the third argument lets build know
// that files can be overwritten
erectorSet.build(questions, templates, true);
/*
    // build passes the set of answers down the promise chain
    .then((answers) => {
        console.info(answers);
    });
*/