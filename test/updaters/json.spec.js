'use strict';

const tap = require('tap');
const sinon = require('sinon');

const utils = require('../../src/utils');
const jsonUpdater = require('../../src/updaters/json');

const exist = {
    a: { b: 'c' },
    d: true
};
const merged = {
    a: { b: 'e' },
    d: true
};
const replace = {
    a: { b: 'e' }
};
const existFile = 'exist';
const mergedFile = 'merged';
const replaceFile = 'replace';
let mockMerge;
let mockParse;
let mockStringify;


tap.test('Updaters: JSON [tests]', (suite) => {
    suite.beforeEach((done) => {
        mockMerge = sinon.stub(utils, 'mergeDeep');
        mockParse = sinon.stub(JSON, 'parse');
        mockStringify = sinon.stub(JSON, 'stringify');

        mockParse.returns('parseReturn');
        mockMerge.returns('mergeReturn');
        mockStringify.returns('stringifyReturn');

        done();
    });

    suite.afterEach((done) => {
        mockMerge.restore();
        mockParse.restore();
        mockStringify.restore();

        done();
    });

    suite.test('should call JSON.parse on existing & replacement', (test) => {
        test.plan(2);

        jsonUpdater(existFile, replaceFile);

        test.equal(mockParse.firstCall.args[0], existFile);
        test.equal(mockParse.secondCall.args[0], replaceFile);

        test.end();
    });

    suite.test('should call utils.mergeDeep with JSON.parsed existing & replacement', (test) => {
        test.plan(1);

        jsonUpdater(existFile, replaceFile);

        test.deepEqual(mockMerge.firstCall.args, ['parseReturn', 'parseReturn']);

        test.end();
    });

    suite.test('should call JSON.stringify with the returned value from utils.mergeDeep', (test) => {
        test.plan(1);

        jsonUpdater(existFile, replaceFile);

        test.deepEqual(mockStringify.firstCall.args, ['mergeReturn', null, 2]);

        test.end();
    });

    suite.test('should return the result of JSON.stringify', (test) => {
        test.plan(1);

        const result = jsonUpdater(existFile, replaceFile);

        test.equal(result, 'stringifyReturn');

        test.end();
    });

    suite.end();
});

