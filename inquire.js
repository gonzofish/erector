'use strict';

const readline = require('readline');

module.exports = (questions) => {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return inquire(reader, questions, [])
        .then((answers) => {
            reader.close();

            return answers;
        });
};

const inquire = (reader, questions, previousAnswers) => {
    let answers = [];
    const question = questions[0] || {};

    if (question.question) {
        return query(reader, question, previousAnswers)
            .then((answer) => {
                answers.push(generateAnswer(question, answer));

                return inquire(reader, questions.slice(1), previousAnswers.concat(answers));
            })
            .then((followingAnswers) => answers.concat(followingAnswers));
    } else if (question.useAnswer) {
        answers.push(deriveAnswer(question, previousAnswers));
        return inquire(reader, questions.slice(1), previousAnswers.concat(answers))
            .then((followingAnswers) => answers.concat(followingAnswers));
    } else {
        return Promise.resolve([]);
    }
};

const query = (reader, question, answers) => {
    const promise = new Promise((resolve, reject) => {
        reader.question(question.question.trim() + ' ', (rawAnswer) => {
            const answer = transformAnswer(rawAnswer, answers, question.transform);

            if (checkIsAnswerValid(answer, question.allowBlank)) {
                resolve(answer);
            } else {
                reject();
            }
        });
    });

    return promise
        .catch(() => query(reader, question));
};

const deriveAnswer = (question, answers) => {
    const answerToUse = answers.find((answer) => answer.name = question.useAnswer);
    let answer = '';

    if (answerToUse) {
        answer = transformAnswer(answerToUse.answer, answers, question.transform);
    }

    return generateAnswer(question, answer);
};

const transformAnswer = (answer, answers, transform) => {
    let newAnswer = answer;

    if (typeof transform === 'function') {
        newAnswer = transform(answer, answers);
    }

    return newAnswer;
};

const checkIsAnswerValid = (answer, allowBlank) => {
    switch (getValueType(answer)) {
        case 'string':
            return !!answer || allowBlank;
        case 'null':
        case 'undefined':
            return false;
        default:
            return true;
    }
};

const getValueType = (value) =>
    Object.prototype.toString.call(value)
        .replace(/\[object |]/g, '')
        .toLowerCase();

const generateAnswer = (question, answer) => ({
    name: question.name,
    answer: answer
});