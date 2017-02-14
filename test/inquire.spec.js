'use strict';

const fs = require('fs');
const readline = require('readline');
const sinon = require ('sinon');
const tap = require('tap');

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

tap.test('.inquire', (suite) => {
    suite.beforeEach((done) => {
        mockAnswersPath = sinon.stub(utils, 'getAnswersPath');
        mockCreateInterface = sinon.stub(readline, 'createInterface');
        mockFsExists = sinon.stub(fs, 'existsSync');
        mockFsReadFile = sinon.stub(fs, 'readFileSync');
        mockFsWriteFile = sinon.stub(fs, 'writeFileSync');

        mockAnswersPath.returns('baba booey');
        mockCreateInterface.returns(mockReadline);

        done();
    });

    suite.afterEach((done) => {
        mockAnswersPath.restore();
        mockCreateInterface.restore();
        mockFsExists.restore();
        mockFsReadFile.restore();
        mockFsWriteFile.restore();

        done();
    });

    suite.test('should create a new readline interface', (test) => {
        test.plan(1);

        inquire([]);

        // same == equivalent
        test.same(mockCreateInterface.firstCall.args[0], {
            input: process.stdin,
            output: process.stdout
        });

        test.end();
    });

    suite.test('should get the answers path and see if the .erector file exists', (test) => {
        test.plan(2);

        inquire([]);

        test.ok(mockAnswersPath.called);
        test.equal(mockFsExists.lastCall.args[0], 'baba booey');

        test.end();
    });

    suite.test('should parse the .erector file if it exists', (test) => {
        const mockParse = sinon.stub(JSON, 'parse');

        test.plan(1);

        mockFsExists.returns(true);
        mockFsReadFile.returns('fafa flo fly');

        inquire([]);

        test.same(mockFsReadFile.lastCall.args, ['baba booey', 'utf8']);

        mockParse.restore();
        test.end();
    });

    suite.test('should close the readline interface if no questions are provided', (test) => {
        test.plan(1);

        inquire([]).then(() => {
            test.ok(mockReadline.close.called);
            test.end();
        });
    });

    suite.test('should ask the a question if the `question` attribute exists on the question object', (test) => {
        const questions = [
            { question: '  Do you like food?                ' }
        ];

        test.plan(1);

        inquire(questions);

        // need to call the reader.question callback
        mockReadline.question.lastCall.args[1]('test');

        test.equal(mockReadline.question.lastCall.args[0], 'Do you like food? ');
        test.end();
    });

    suite.test('should pre-populate the answer if a previous answer exists', (test) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];
        const mockParse = sinon.stub(JSON, 'parse');

        test.plan(1);

        mockFsExists.returns(true);
        mockParse.returns([
            { answer: 'N', name: 'food' }
        ]);

        inquire(questions);

        test.equal(mockReadline.write.lastCall.args[0], 'N');
        test.end();

        mockFsExists.returns(false);
        mockParse.restore();
    });

    suite.test('should ask multiple questions', (test) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' },
            { question: 'What kind of food?', name: 'kinds' }
        ];

        test.plan(2);
        mockReadline.question.reset();

        const promise = inquire(questions);
        mockReadline.question.lastCall.args[1]('Y');

        // we run the setTimeout because there are nested Promises at work
        setTimeout(() => {
            test.ok(mockReadline.question.calledTwice);
            test.equal(mockReadline.question.lastCall.args[0], 'What kind of food? ');
            test.end();
        });
    });

    suite.test('should ask the question again if the answer is NOT valid', (test) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];

        test.plan(2);
        mockReadline.question.reset();

        inquire(questions);
        mockReadline.question.lastCall.args[1]();

        setTimeout(() => {
            test.ok(mockReadline.question.calledTwice);
            test.equal(mockReadline.question.lastCall.args[0], 'Do you like food? ');
            test.end();
        });
    });

    suite.test('should resolve the question Promise if the answer is valid', (test) => {
        const questions = [
            { question: 'Do you like food?', name: 'food' }
        ];

        test.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.lastCall.args[1]('Y');

        promise.then((answers) => {
            test.same(answers, [
                { answer: 'Y', name: 'food' }
            ]);
            test.end();
        });
    });

    suite.test('should use an answer to answer another question if the useAnswer attribute is set', (test) => {
        const questions = [
            { question: 'What is you favorite food?', name: 'fav' },
            { name: 'derived', useAnswer: 'fav' }
        ];

        test.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.firstCall.args[1]('pizza');

        promise.then((answers) => {
            test.same(answers, [
                { answer: 'pizza', name: 'fav' },
                { answer: 'pizza', name: 'derived' }
            ]);
            test.end();
        });
    });

    suite.test('should use a blank to answer a question if the useAnswer attribute is set to an unknown answer name', (test) => {
        const questions = [
            { question: 'What is you favorite food?', name: 'fav' },
            { name: 'derived', useAnswer: 'favorite' }
        ];

        test.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.firstCall.args[1]('pizza');

        promise.then((answers) => {
            test.same(answers, [
                { answer: 'pizza', name: 'fav' },
                { answer: '', name: 'derived' }
            ]);
            test.end();
        });
    });

    suite.test('should utilize a transform function if one is provided', (test) => {
        const questions = [
            { question: 'What is you favorite food?', name: 'fav' },
            { name: 'derived', transform: (value) => `${value} is the best!`, useAnswer: 'fav' }
        ];

        test.plan(1);
        mockReadline.question.reset();

        const promise = inquire(questions);

        mockReadline.question.firstCall.args[1]('pizza');

        promise.then((answers) => {
            test.same(answers, [
                { answer: 'pizza', name: 'fav' },
                { answer: 'pizza is the best!', name: 'derived' }
            ]);
            test.end();
        });
    });

    suite.done();
});

