'use strict';

const fs = require('fs');
const readline = require('readline');
const utils = require('./utils');

module.exports = (questions) => {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let previousAnswers = [];
    let answersPath = utils.getAnswersPath();
    if (fs.existsSync(answersPath)) {
        previousAnswers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
    }

    return inquire(reader, questions, previousAnswers)
        .then((answers) => {
            reader.close();

            return answers;
        });
};

const inquire = (reader, questions, previousAnswers) => {
    const question = questions[0] || {};
    let promise;

    if (question.question) {
        promise = askQuestion(reader, questions, previousAnswers);
    } else if (question.useAnswer) {
        promise = useAnswer(reader, questions, previousAnswers);
    } else {
        promise = Promise.resolve([]);
    }

    return promise.then((followingAnswers) => {
        const answers = [].concat(followingAnswers)
        fs.writeFileSync(utils.getAnswersPath(), JSON.stringify(answers));
        
        return answers;
    });
};

const askQuestion = (reader, questions, previousAnswers) => {
    const question = questions[0];

    return query(reader, question, previousAnswers)
        .then((answer) => {
            answer = generateAnswer(question, answer);

            return askNextQuestion(reader, questions, previousAnswers, answer);
            return inquire(reader, questions.slice(1), previousAnswers.concat(answer))
                .then((followingAnswers) => [answer].concat(followingAnswers));
        });
};

const query = (reader, question, answers) => {
    const previousAnswer = findAnswer(question, answers);
    const promise = new Promise((resolve, reject) => {
        reader.question(question.question.trim() + ' ', (rawAnswer) => {
            const answer = transformAnswer(rawAnswer, answers, question.transform);

            if (checkIsAnswerValid(answer, question.allowBlank)) {
                resolve(answer);
            } else {
                reject();
            }
        });
        if (previousAnswer) {
            reader.write(previousAnswer.answer);
        }
    });

    return promise
        .catch(() => query(reader, question));
};

const useAnswer = (reader, questions, previousAnswers) => {
    const answer = deriveAnswer(questions[0], previousAnswers);

    return askNextQuestion(reader, questions, previousAnswers, answer);
};

const findAnswer = (question, answers) => {
    if (answers === undefined) {
        return undefined;
    }
    return answers.find((answer) => {
        return answer.name === question.name
    });
};

const deriveAnswer = (question, answers) => {
    const answerToUse = answers.find((answer) => answer.name === question.useAnswer);
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

const askNextQuestion = (reader, questions, previousAnswers, answer) =>
    inquire(reader, questions.slice(1), previousAnswers.concat(answer))
        .then((followingAnswers) => [answer].concat(followingAnswers));

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