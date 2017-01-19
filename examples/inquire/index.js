'use strict';

// const erectorSet = reqiure('erector-set');
const erectorSet = require('../../index');
const questions = require('../questions');

erectorSet.inquire(questions).then((answers) => {
    console.info(answers);
});