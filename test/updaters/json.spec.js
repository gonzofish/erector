'use strict';

const test = require('tape');
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

test('Updaters: JSON [setup]', (t) => {
    mockMerge = sinon.stub(utils, 'mergeDeep');
    mockParse = sinon.stub(JSON, 'parse');
    mockStringify = sinon.stub(JSON, 'stringify');

    mockParse.returns('parseReturn');
    mockMerge.returns('mergeReturn');
    mockStringify.returns('stringifyReturn');

    t.end();
});

test('Updaters: JSON [tests]', (group) => {
    group.test('should call JSON.parse on existing & replacement', (t) => {
        t.plan(2);

        jsonUpdater(existFile, replaceFile);

        t.equal(mockParse.firstCall.args[0], existFile);
        t.equal(mockParse.secondCall.args[0], replaceFile);

        t.end();
    });

    group.test('should call utils.mergeDeep with JSON.parsed existing & replacement', (t) => {
        t.plan(1);

        jsonUpdater(existFile, replaceFile);

        t.deepLooseEqual(mockMerge.firstCall.args, ['parseReturn', 'parseReturn']);

        t.end();
    });

    group.test('should call JSON.stringify with the returned value from utils.mergeDeep', (t) => {
        t.plan(1);

        jsonUpdater(existFile, replaceFile);

        t.deepLooseEqual(mockStringify.firstCall.args, ['mergeReturn', null, 2]);
    });

    group.test('should return the result of JSON.stringify', (t) => {
        t.plan(1);

        const result = jsonUpdater(existFile, replaceFile);

        t.equal(result, 'stringifyReturn');

        t.end();
    });

    group.end();
});

// Tear down
test('Updaters: JSON [tear-down]', (t) => {
    mockMerge.restore();
    mockParse.restore();
    mockStringify.restore();

    t.end();
});
