'use strict';

const inquire = require('../inquire');

inquire([
   { question: 'How are you?', name: 'how' },
   { question: 'What about you?', name: 'and-you' },
   { question: 'Final thoughts:', name: 'finalThoughts' }
]).then((answers) => {
    console.info(answers);
});