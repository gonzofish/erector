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

const create = () => {
    const destination = replace(template.destination, answers);
    let output;

    ensureDirectories(destination);

    if (!fs.existsSync(destination) || template.overwrite) {
        output = replace(template.template, answers, true);
    } else if(template.update) {
        output = update(template, answers);
    }

    fs.writeFileSync(destination, output, { encoding: 'utf8' });
};

const checkCreateFile = (template, answers) => {
    let create = true;

    if (typeof template.check === 'function') {
        create = template.check(answers);
    }

    return create;
};

const update = (template, answers) => {
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
    const updateType = utils.getType(template.update);
    let method;

    if (updateType === 'function') {
        method = template.update;
    } else if (updateType === 'string' && utils.checkIsType(updaters[updateType], 'function')) {
        method = updaters[updateType];
    }

    return method;
};

const replace = (template, answers, checkIsFile) => {
    let output = '';

    if (template && typeof template === 'string') {
        template = getTemplate(template, checkIsFile);
        output = answers.reduce(replaceAnswer, template);
    }
};

    return output;

const getTemplate = (template, checkIsFile) => {
    if (checkIsFile && fs.existsSync(template)) {
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
