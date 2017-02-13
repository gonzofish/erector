'use strict';

const path = require('path');
const test = require('tape');
const sinon = require('sinon');

const utils = require('../src/utils');

test('utils.getType should return a lower-case string for the value type', (t) => {
    t.plan(7);

    t.equal(utils.getType('123'), 'string');
    t.equal(utils.getType(123), 'number');
    t.equal(utils.getType(false), 'boolean');
    t.equal(utils.getType(() => {}), 'function');
    t.equal(utils.getType([]), 'array');
    t.equal(utils.getType({}), 'object');
    t.equal(utils.getType(new Date()), 'date');

    t.end();
});

test('utils.checkIsType should return true if type is the same as the return value from getType', (t) => {
    t.plan(7);

    t.ok(utils.checkIsType('123', 'string'));
    t.ok(utils.checkIsType(123, 'number'));
    t.ok(utils.checkIsType(false, 'boolean'));
    t.ok(utils.checkIsType(() =>{}, 'function'));
    t.ok(utils.checkIsType([], 'array'));
    t.ok(utils.checkIsType({}, 'object'));
    t.ok(utils.checkIsType(new Date(), 'date'));

    t.end();
});

test('utils.copyValue should return a copy of the original value', (t) => {
    const numbers = [1, 2, 3];
    const date = new Date();

    t.plan(6);

    t.same(utils.copyValue(numbers), numbers);
    t.notEqual(utils.copyValue(numbers), numbers);

    t.same(utils.copyValue({ a: numbers }), { a: numbers });
    t.notEqual(utils.copyValue({ a: numbers }), { a: numbers });

    t.same(utils.copyValue(date), date);
    t.notEqual(utils.copyValue(date), date);

    t.end();
});

test('utils.mergeDeep should return an object with the source overwriting the target', (t) => {
    const targetDate = new Date();
    const target = {
        a: [1, 2, 3],
        b: false,
        c: {
            e: targetDate,
            f: ['a', 'b']
        }
    };
    const source = {
        a: [5, 4],
        b: true,
        c: {
            f: ['d']
        }
    };

    t.deepEqual(utils.mergeDeep(target, source), {
        a: [1, 2, 3, 5, 4],
        b: true,
        c: {
            e: targetDate,
            f: ['a', 'b', 'd']
        }
    });

    t.end();
});

test('utils.getAnswersPath should return process.cwd() + path.sep + ".erector"', (t) => {
    const mockCwd = sinon.stub(process, 'cwd');
    const sep = path.sep;

    t.plan(1);

    mockCwd.returns('/a/pizza/place');

    t.equal(utils.getAnswersPath(), `/a/pizza/place${sep}.erector`);

    mockCwd.restore();
});
