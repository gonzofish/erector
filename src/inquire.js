'use strict';

const fs = require('fs');
const readline = require('readline');
const utils = require('./utils');

const baseCompleter = (line) => [[''], line];
let completer = baseCompleter;

module.exports = (questions, saveAnswers, previousAnswerTransforms) => {
    const reader = readline.createInterface({
        completer: (line) => completer(line),
        input: process.stdin,
        output: process.stdout
    });

    let previousAnswers = [];
    let answersPath = utils.getAnswersPath();
    if (fs.existsSync(answersPath)) {
        previousAnswers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
        previousAnswers = transformPreviousAnswers(
            previousAnswers,
            previousAnswerTransforms || {}
        );
    }

    return inquire(reader, questions, previousAnswers, saveAnswers)
        .then((answers) => {
            reader.close();

            if (saveAnswers) {
                fs.writeFileSync(utils.getAnswersPath(), JSON.stringify(answers), { encoding: 'utf8' });
            }

            return answers;
        });
};

const transformPreviousAnswers = (answers, transforms) =>
    answers.map((answer) => {
        const transform = transforms[answer.name];

        if (utils.checkIsType(transform, 'function')) {
            answer.answer = transform(answer.answer);
        }

        return answer;
    });

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

    return promise.then((followingAnswers) => [].concat(followingAnswers));
};

const askQuestion = (reader, questions, previousAnswers) => {
    const question = questions[0];

    return query(reader, question, previousAnswers)
        .then((answer) => {
            answer = generateAnswer(question, answer);

            return askNextQuestion(reader, questions, previousAnswers, answer);
        });
};

const query = (reader, question, answers) => {
    const previousAnswer = findAnswer(answers, question);
    const defaultAnswer = getDefaultAnswer(question, answers);

    const promise = new Promise((resolve, reject) => {
        completer = baseCompleter;

        if (defaultAnswer) {
            completer = (line) => {
                const complete = defaultAnswer.startsWith(line) || !line;
                return [[complete ? defaultAnswer : ''], line];
            };
        };

        reader.question(augmentQuestion(question.question, defaultAnswer), (rawAnswer) => {
            const answer = transformAnswer(rawAnswer, answers, question);

            if (checkIsAnswerValid(answer, question)) {
                resolve(answer || defaultAnswer);
            } else {
                reject();
            }
        });
        if (previousAnswer !== undefined) {
            reader.write('' + previousAnswer);
        }
    });

    return promise
        .catch(() => query(reader, question, answers));
};

const augmentQuestion = (question, defaultAnswer) => {
    let text = question.trim();
    const validPunctuation = [':', '.', '?', '!'];
    const punctuationIndex = validPunctuation.indexOf(text[text.length - 1]);
    let punctuation;

    if (punctuationIndex !== -1) {
        text = text.slice(0, text.length - 1);
        punctuation = validPunctuation[punctuationIndex];
    }

    if (defaultAnswer) {
        text = text + ` (${ defaultAnswer })`;
    }

    if (punctuation) {
        text = text + punctuation;
    }

    return text + ' ';
};

const getDefaultAnswer = (question, answers) => {
    let answer = '';

    if ('defaultAnswer' in question) {
        answer = utils.checkIsType(question.defaultAnswer, 'function') ?
            question.defaultAnswer(answers) : question.defaultAnswer;
    }

    return answer;
};

const useAnswer = (reader, questions, previousAnswers) => {
    let answer = deriveAnswer(questions[0], previousAnswers);

    if (answer && answer.answer === undefined) {
        answer.answer = '';
    }

    return askNextQuestion(reader, questions, previousAnswers, answer);
};

const deriveAnswer = (question, answers) => {
    const answerToUse = findAnswer(answers, { name: question.useAnswer });
    const answer = transformAnswer(answerToUse, answers, question);

    return generateAnswer(question, answer);
};

const findAnswer = (answers, question) => {
    let answer = answers.find((answer) => answer.name === question.name);

    if (answer !== undefined && 'answer' in answer) {
        answer = answer.answer;
    }

    return answer;
};

const transformAnswer = (answer, answers, question) => {
    const transform = question.transform;
    let newAnswer = answer;

    if (typeof transform === 'function') {
        newAnswer = transform(answer, answers);
    } else if (question.defaultAnswer) {
        newAnswer = '';
    }

    return newAnswer;
};

const askNextQuestion = (reader, questions, previousAnswers, answer) => {
    return inquire(reader, questions.slice(1), previousAnswers.concat(answer))
        .then((followingAnswers) => [answer].concat(followingAnswers));
};

const checkIsAnswerValid = (answer, question) => {
    switch (utils.getType(answer)) {
        case 'string':
            return !!answer || question.allowBlank || question.defaultAnswer;
        case 'null':
        case 'undefined':
            return false;
        default:
            return true;
    }
};

const generateAnswer = (question, answer) => ({
    name: question.name,
    answer: answer
});