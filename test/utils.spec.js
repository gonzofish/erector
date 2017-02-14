'use strict';

const path = require('path');
const tap = require('tap');
const sinon = require('sinon');

const utils = require('../src/utils');

tap.test('utils.getType should return a lower-case string for the value type', (test) => {
    test.plan(7);

    test.equal(utils.getType('123'), 'string');
    test.equal(utils.getType(123), 'number');
    test.equal(utils.getType(false), 'boolean');
    test.equal(utils.getType(() => {}), 'function');
    test.equal(utils.getType([]), 'array');
    test.equal(utils.getType({}), 'object');
    test.equal(utils.getType(new Date()), 'date');

    test.end();
});

tap.test('utils.checkIsType should return true if type is the same as the return value from getType', (test) => {
    test.plan(7);

    test.ok(utils.checkIsType('123', 'string'));
    test.ok(utils.checkIsType(123, 'number'));
    test.ok(utils.checkIsType(false, 'boolean'));
    test.ok(utils.checkIsType(() =>{}, 'function'));
    test.ok(utils.checkIsType([], 'array'));
    test.ok(utils.checkIsType({}, 'object'));
    test.ok(utils.checkIsType(new Date(), 'date'));

    test.end();
});

tap.test('utils.copyValue should return a copy of the original value', (test) => {
    const numbers = [1, 2, 3];
    const date = new Date();

    test.plan(6);

    test.same(utils.copyValue(numbers), numbers);
    test.notEqual(utils.copyValue(numbers), numbers);

    test.same(utils.copyValue({ a: numbers }), { a: numbers });
    test.notEqual(utils.copyValue({ a: numbers }), { a: numbers });

    test.same(utils.copyValue(date), date);
    test.notEqual(utils.copyValue(date), date);

    test.end();
});

tap.test('utils.mergeDeep should return a non-array, non-object', (test) => {
    test.plan(1);
    test.equal(utils.mergeDeep(12, 13), 13);
    test.end();
});

tap.test('utils.mergeDeep should return an object with the source overwriting the target', (test) => {
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

    test.plan(1);

    test.deepEqual(utils.mergeDeep(target, source), {
        a: [1, 2, 3, 5, 4],
        b: true,
        c: {
            e: targetDate,
            f: ['a', 'b', 'd']
        }
    });

    test.end();
});

tap.test('utils.getAnswersPath should return process.cwd() + path.sep + ".erector"', (test) => {
    const mockCwd = sinon.stub(process, 'cwd');
    const sep = path.sep;

    test.plan(1);

    mockCwd.returns('/a/pizza/place');

    test.equal(utils.getAnswersPath(), `/a/pizza/place${sep}.erector`);

    mockCwd.restore();
});
