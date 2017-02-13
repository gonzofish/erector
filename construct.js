'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

module.exports = (answers, templates, overwrite) => templates.forEach((template) => {
    const createFile = checkCreateFile(template, answers);

    if (createFile) {
        const destination = replace(template.destination, answers);

        ensureDirectories(destination);

        if (!fs.existsSync(destination) || overwrite || template.overwrite) {
            const output = replace(template.template, answers, true);

            fs.writeFileSync(destination, output, { encoding: 'utf8' });
        }
        else if(template.update) {
            const templateObj = JSON.parse(replace(template.template, answers, true));
            const existing = JSON.parse(fs.readFileSync(destination, 'utf8'));

            const updated = utils.mergeDeep(existing, templateObj);
            fs.writeFileSync(destination, JSON.stringify(updated, null, 2));
        }
    }
});

const checkCreateFile = (template, answers) => {
    let create = true;

    if (typeof template.check === 'function') {
        create = template.check(answers);
    }

    return create;
};

const replace = (template, answers, checkIsFile) => {
    let output = '';

    if (template && typeof template === 'string') {
        template = getTemplate(template, checkIsFile);
        output = answers.reduce(replaceAnswer, template);
    }

    return output;
};

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
