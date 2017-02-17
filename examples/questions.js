'use strict';

const handleYesNo = (value) => {
    const isString = typeof value === 'string';

    if (isString && value.match(/^(y(es)?|no?|Alright\!)$/)) {
        value = getYesNoValue(value);
    } else {
        value = null;
    }

    return value;
};

const getYesNoValue = (value) => {
    // a would only be from Alright!
    const lookup = { a: true, n: false, y: true };

    value = value[0].toLowerCase();

    if (lookup[value]) {
        value = 'Alright!';
    } else {
        value = '';
    }

    return value;
};

const convertSpaces = (value) => value.replace(/\s/g, '');

module.exports = [
    { name: 'food', question: 'What is your favorite food?' },
    { allowBlank: true, name: 'unused', question: 'What is your age?' },
    { allowBlank: true, name: 'yesNo', question: 'Answer yes/no:', transform: handleYesNo },
    { name: 'foodId', transform: convertSpaces, useAnswer: 'food' }
];