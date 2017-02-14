'use strict';

const fs = require('fs');
const path = require('path');
const updaters = require('./updaters');
const utils = require('./utils');

module.exports = (answers, templates) => templates.forEach((template) => {
    const createFile = checkCreateFile(template, answers);

    if (createFile) {
        create(template, answers);
    }
});

const checkCreateFile = (template, answers) => {
    let create = true;

    if (utils.checkIsType(template.check, 'function')) {
        create = template.check(answers);
    }

    return create;
};

const create = (template, answers) => {
    const destination = replace(template.destination, answers);
    let write = false;
    let output;

    ensureDirectories(destination);

    if (!fs.existsSync(destination) || template.overwrite) {
        output = replace(template.template, answers, true);
        write = true;
    } else if(template.update) {
        output = update(template, answers, destination);
        write = true;
    }

    if (write) {
        fs.writeFileSync(destination, output, { encoding: 'utf8' });
    }
};

const update = (template, answers, destination) => {
    const replacement = replace(template.template, answers, true);
    const existing = fs.readFileSync(destination, 'utf8');
    const updateMethod = getUpdateMethod(template);
    let updated = existing;

    if (updateMethod) {
        updated = updateMethod(existing, replacement);
    }

    return updated;
};

const getUpdateMethod = (template) => {
    const updateMethod = template.update;
    const updateType = utils.getType(updateMethod);
    let method;

    if (updateType === 'function') {
        method = updateMethod;
    } else if (updateType === 'string' && utils.checkIsType(updaters[updateMethod], 'function')) {
        method = updaters[updateMethod];
    }

    return method;
};

const replace = (template, answers, isFile) => {
    let output = '';

    if (template && typeof template === 'string') {
        template = getTemplate(template, !!isFile);
        output = answers.reduce(replaceAnswer, template);
    }

    return output;
};


const getTemplate = (template, isFile) => {
    if (isFile && fs.existsSync(template)) {
        template = fs.readFileSync(template, 'utf8');
    }

    return template;
};

const replaceAnswer = (template, answer) => {
    const regex = new RegExp(`\\{\\{\\s*${answer.name}\\s*\\}\\}`, 'g');

    return template.replace(regex, answer.answer);
};

const ensureDirectories = (filepath) => {
    const rootDirectory = process.cwd();
    // gets every directory below the root directory from filepath in an array
    const directories = filepath.replace(rootDirectory, '')
        .split(path.sep).
        slice(1, -1);

    directories.reduce((previousPath, directory) => {
        const currentPath = path.resolve(previousPath, directory);

        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
        }

        return currentPath;
    }, rootDirectory);
};
