'use strict';

const fs = require('fs');
const readline = require('readline');
const sinon = require ('sinon');
const test = require('tape');

const inquire = require('../src/inquire');
const utils = require('../src/utils');

const mockReadline = {
    close: sinon.spy(),
    question: sinon.spy(),
    write: sinon.spy()
};

let mockAnswersPath;
let mockCreateInterface;
let mockFsExists;
let mockFsReadFile;
let mockFsWriteFile;

test('.inquire [setup]', (t) => {
    const createInterface = readline.createInterface;

    mockAnswersPath = sinon.stub(utils, 'getAnswersPath');
    mockCreateInterface = sinon.stub(readline, 'createInterface');
    mockFsExists = sinon.stub(fs, 'existsSync');
    mockFsReadFile = sinon.stub(fs, 'readFileSync');
    mockFsWriteFile = sinon.stub(fs, 'writeFileSync');

    mockAnswersPath.returns('baba booey');
    mockCreateInterface.returns(mockReadline);

    t.end();
});

test('.inquire setup', (suite) => {
    suite.test('should create a new readline interface', (t) => {
        t.plan(1);

        inquire([]);

        // same == equivalent
        t.same(mockCreateInterface.firstCall.args[0], {
            input: process.stdin,
            output: process.stdout
        });

        t.end();
    });

    suite.test('should get the answers path and see if the .erector file exists', (t) => {
        t.plan(2);

        inquire([]);

        t.ok(mockAnswersPath.called);
        t.equal(mockFsExists.lastCall.args[0], 'baba booey');

        t.end();
    });

    suite.test('should parse the .erector file if it exists', (t) => {
        const mockParse = sinon.stub(JSON, 'parse');

        t.plan(1);

        mockFsExists.returns(true);
        mockFsReadFile.returns('fafa flo fly');

        inquire([]);

        t.same(mockFsReadFile.lastCall.args, ['baba booey', 'utf8']);

        mockParse.restore();
        mockFsExists.returns(false);

        t.end();
    });

    suite.test('should close the readline interface if no questions are provded', (t) => {
        t.plan(1);

        inquire([]).then(() => {
            t.ok(mockReadline.close.called);
            t.end();
        });
    });

    suite.test('should ask the a question if the `question` attribute exists on the question object', (t) => {
        const questions = [
            { question: '  Do you like food?                ' }
        ];

        t.plan(1);

        inquire(questions);

        // need to call the reader.question callback
        mockReadline.question.lastCall.args[1]('test');

        t.equal(mockReadline.question.lastCall.args[0], 'Do you like food? ');
        t.end();
    });

    suite.test('should pre-populate the answer if a previous answer exists', (t) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];
        const mockParse = sinon.stub(JSON, 'parse');

        t.plan(1);

        mockFsExists.returns(true);
        mockParse.returns([
            { answer: 'N', name: 'food' }
        ]);

        inquire(questions);

        t.equal(mockReadline.write.lastCall.args[0], 'N');
        t.end();

        mockFsExists.returns(false);
        mockParse.restore();
    });

    suite.test('should ask multiple questions', (t) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' },
            { question: 'What kind of food?', name: 'kinds' }
        ];

        t.plan(2);
        mockReadline.question.reset();

        const promise = inquire(questions);
        mockReadline.question.lastCall.args[1]('Y');

        // we run the setTimeout because there are nested Promises at work
        setTimeout(() => {
            t.ok(mockReadline.question.calledTwice);
            t.equal(mockReadline.question.lastCall.args[0], 'What kind of food? ');
            t.end();
        });
    });

    suite.test('should ask the question again if the answer is NOT valid', (t) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];

        t.plan(2);
        mockReadline.question.reset();

        inquire(questions);
        mockReadline.question.lastCall.args[1]();

        setTimeout(() => {
            t.ok(mockReadline.question.calledTwice);
            t.equal(mockReadline.question.lastCall.args[0], 'Do you like food? ');
            t.end();
        });
    });

    suite.test('should resolve the question Promise if the answer is valid', (t) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];

        t.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.lastCall.args[1]('Y');

        promise.then((answers) => {
            t.same(answers, [
                { answer: 'Y', name: 'food' }
            ]);
            t.end();
        });
    });

    suite.test('should use an answer to answer another question if the useAnswer attribute is set', (t) => {
        const questions = [
            { question: 'What is you favorite food?', name: 'fav' },
            { name: 'derived', useAnswer: 'fav' }
        ];

        t.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.firstCall.args[1]('pizza');

        promise.then((answers) => {
            t.same(answers, [
                { answer: 'pizza', name: 'fav' },
                { answer: 'pizza', name: 'derived' }
            ]);
            t.end();
        });
    });

    suite.test('should utilize a transform function if one is provided', (t) => {
        const questions = [
            { question: 'What is you favorite food?', name: 'fav' },
            { name: 'derived', transform: (value) => `${value} is the best!`, useAnswer: 'fav' }
        ];

        t.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.firstCall.args[1]('pizza');

        promise.then((answers) => {
            t.same(answers, [
                { answer: 'pizza', name: 'fav' },
                { answer: 'pizza is the best!', name: 'derived' }
            ]);
            t.end();
        });
    });
});

test('.inquire [tear-down]', (t) => {
    mockAnswersPath.restore();
    mockCreateInterface.restore();
    mockFsExists.restore();
    mockFsReadFile.restore();

    t.end();
});
