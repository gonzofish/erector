/*
    NEEDED STUBS:

    fs.existsSync
    fs.mkdirSync
    fs.readFileSync
    fs.writeFileSync

    path.resolve?

    updaters.json?
    utils.checkIsType
    utils.getType
*/

/*
    1. Check if we should create file
    2. Perform replacement on template.destination
    3. Perform replacement on template.template
*/
'use strict';

const fs = require('fs');
const path = require('path');
const sinon = require ('sinon');
const tap = require('tap');

const construct = require('../src/construct');
const updaters = require('../src/updaters');
const utils = require('../src/utils');

let mockCheckType;
let mockExists;
let mockMkdir;
let mockRead;
let mockReplace;
let mockWrite;

tap.test('.construct', (suite) => {
    suite.beforeEach((done) => {
        const realReplace = String.prototype.replace;

        mockCheckType = sinon.stub(utils, 'checkIsType');
        mockExists = sinon.stub(fs, 'existsSync');
        mockMkdir = sinon.stub(fs, 'mkdirSync');
        mockRead = sinon.stub(fs, 'readFileSync');
        mockReplace = sinon.stub(String.prototype, 'replace', realReplace);
        mockWrite = sinon.stub(fs, 'writeFileSync');

        done();
    });

    suite.afterEach((done) => {
        mockCheckType.restore();
        mockExists.restore();
        mockMkdir.restore();
        mockRead.restore();
        mockReplace.restore();
        mockWrite.restore();

        done();
    });

    suite.test('should check that a file should be created if a `check` function is provided', (test) => {
        const checkSpy = sinon.spy(() => false);

        test.plan(2);
        mockCheckType.returns(true);

        construct([], [
            { destination: 'this/location/file.txt', template: 'my/template.txt', check: checkSpy }
        ]);

        test.ok(mockCheckType.called);
        test.ok(checkSpy.called);
        test.end();
    });

    suite.test('should perform replacements on the template destination', (test) => {
        test.plan(2);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: 'this/location/{{ name }}.txt', template: 'my/template.txt' }
        ]);

        // should not call because it should be marked has !isFile
        test.ok(mockExists.neverCalledWith('this/location/{{ name }}.txt'));
        test.ok(mockReplace.calledWith(new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g'), 'pizza'));

        test.end();
    });

    suite.test('should verify that the directory where the template will live exists', (test) => {
        const rootDir = process.cwd();
        const pathSep = path.sep;
        const dirs = [
            path.resolve(rootDir, 'this'),
            path.resolve(rootDir, 'this', 'location')
        ];

        path.sep = '/';
        mockExists.withArgs(dirs[0]).returns(true);
        mockExists.withArgs(dirs[1]).returns(false);
        test.plan(4);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: `/this/location/{{ name }}.txt`, template: 'my/template.txt' }
        ]);

        test.ok(mockExists.calledWith(dirs[0]));
        test.ok(mockExists.calledWith(dirs[1]));
        test.ok(mockMkdir.neverCalledWith(dirs[0]));
        test.ok(mockMkdir.calledWith(dirs[1]));

        path.sep = pathSep;
        test.end();
    });

    suite.test('should perform replacements for new files', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        mockExists.withArgs('/this/location/test.txt').returns(false);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the template!');
        test.plan(5);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: `/this/location/test.txt`, template: 'my/template.txt' }
        ]);

        test.ok(mockExists.calledWith('/this/location/test.txt'));
        test.ok(mockExists.calledWith('my/template.txt'));
        test.ok(mockRead.calledWith('my/template.txt', 'utf8'));
        // 1 time for destination, 1 time for template
        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'this is the template!', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should NOT perform replacements for non-string template.template', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        mockExists.withArgs('/this/location/test.txt').returns(false);
        mockRead.withArgs('my/template.txt', 'utf8').returns(123);
        test.plan(5);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: `/this/location/test.txt`, template: 123 }
        ]);

        test.ok(mockExists.calledWith('/this/location/test.txt'));
        test.ok(mockExists.neverCalledWith('my/template.txt'));
        test.ok(mockRead.neverCalledWith('my/template.txt', 'utf8'));
        // 1 time for destination, 0 times for template
        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledOnce);
        test.ok(mockWrite.calledWith('/this/location/test.txt', '', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should perform replacements if the template is marker .overwrite', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        mockExists.withArgs('/this/location/test.txt').returns(true);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the {{ name }}!');
        test.plan(5);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', overwrite: true, template: 'my/template.txt' }
        ]);

        test.ok(mockExists.calledWith('/this/location/test.txt'));
        test.ok(mockExists.calledWith('my/template.txt'));
        test.ok(mockRead.calledWith('my/template.txt', 'utf8'));
        // 1 time for destination, 1 time for template
        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'this is the pizza!', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should perform replacements if the template is marker .overwrite', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        mockExists.withArgs('/this/location/test.txt').returns(true);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the {{ name }}!');
        test.plan(5);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', overwrite: true, template: 'my/template.txt' }
        ]);

        test.ok(mockExists.calledWith('/this/location/test.txt'));
        test.ok(mockExists.calledWith('my/template.txt'));
        test.ok(mockRead.calledWith('my/template.txt', 'utf8'));
        // 1 time for destination, 1 time for template
        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'this is the pizza!', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should update the existing file if the destination exists and the template is marked .update', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');
        const updateSpy = sinon.spy(() => 'an updated template...');

        test.plan(4);
        mockExists.withArgs('/this/location/test.txt').returns(true);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('/this/location/test.txt', 'utf8').returns('this is the original!');
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the {{ name }}!');

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', update: updateSpy, template: 'my/template.txt' }
        ]);

        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockRead.calledWith('/this/location/test.txt', 'utf8'));
        test.ok(updateSpy.calledWith('this is the original!', 'this is the pizza!'));
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'an updated template...', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should update the existing file if the destination exists and the template is a known updating method', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');
        const mockJson = sinon.stub(updaters, 'json', () => 'this is some json');

        test.plan(4);
        mockExists.withArgs('/this/location/test.txt').returns(true);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('/this/location/test.txt', 'utf8').returns('this is the original!');
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the {{ name }}!');
        mockCheckType.withArgs(mockJson, 'function').returns(true);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', update: 'json', template: 'my/template.txt' }
        ]);

        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockRead.calledWith('/this/location/test.txt', 'utf8'));
        test.ok(mockJson.calledWith('this is the original!', 'this is the pizza!'));
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'this is some json', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should NOT update the existing file if the destination exists and the template has a non-function .update', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        test.plan(3);
        mockExists.withArgs('/this/location/test.txt').returns(true);
        mockExists.withArgs('my/template.txt').returns(true);
        mockRead.withArgs('/this/location/test.txt', 'utf8').returns('this is the original!');
        mockRead.withArgs('my/template.txt', 'utf8').returns('this is the {{ name }}!');

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', update: 123, template: 'my/template.txt' }
        ]);

        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledTwice);
        test.ok(mockRead.calledWith('/this/location/test.txt', 'utf8'));
        test.ok(mockWrite.calledWith('/this/location/test.txt', 'this is the original!', { encoding: 'utf8' }));

        test.end();
    });

    suite.test('should perform NO write if the file exists and it has no .overwrite or .update', (test) => {
        const nameRegex = new RegExp('\\{\\{\\s*name\\s*\\}\\}', 'g');

        mockExists.withArgs('/this/location/test.txt').returns(true);
        test.plan(3);

        construct([
            { answer: 'pizza', name: 'name' }
        ], [
            { destination: '/this/location/test.txt', template: 'my/template.txt' }
        ]);

        test.ok(mockExists.calledWith('/this/location/test.txt'));
        test.ok(mockReplace.withArgs(nameRegex, 'pizza').calledOnce);
        test.ok(mockWrite.notCalled);

        test.end();
    });


    suite.end();
});