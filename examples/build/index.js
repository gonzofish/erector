'use strict';

const erectorSet = require('../../index');
const questions = require('../questions');

// this custom update function makes sure that
// the original keys/values are always there on an update
// but do not delete any added keys/values
const updateCustom = (existing, replacement) => {
    const exist = JSON.parse(existing);
    // this is the original template
    const replace = JSON.parse(replacement);

    if (!exist.foods) {
        exist.foods = replace.foods;
    }

    exist.foods = replace.foods.reduce((final, food) => {
        if (final.indexOf(food) === -1) {
            final = final.concat(food);
        }

        return final;
    }, exist.foods);

    if (exist.delicious === undefined) {
        exist.delicious = true;
    }

    exist.shops = Object.keys(replace.shops).reduce((final, type) => {
        if (!final[type]) {
            final[type] = replace[type];
        }

        final[type] = replace.shops[type].reduce((shops, store) => {
            if (shops.indexOf(store) === -1) {
                shops = shops.concat(store);
            }

            return shops;
        }, final[type]);

        return final;
    }, exist.shops);

    return JSON.stringify(exist, null, 4);
};

const templates = [
    { destination: __dirname + '/outputs/animal-story.txt', template: 'My favorite food is {{ food }} (id: {{ foodId }})\n{{ yesNo }}' },
    { destination: __dirname + '/outputs/from-template.txt', template: __dirname + '/templates/template.txt' },
    { destination: __dirname + '/outputs/sub/{{ food }}-file' },
    // modify or add values to see how using the json updater updates
    { destination: __dirname + '/outputs/updated.json', template: __dirname + '/templates/updated.json', update: 'json' },
    // add attributes to this output to see how the custom update works
    // works with any file type, since the update method is your own
    { destination: __dirname + '/outputs/custom-update.json', template: __dirname + '/templates/custom.json', update: updateCustom },
    { destination: __dirname + '/outputs/overwritten.txt', template: __dirname + '/templates/overwrite.txt', overwrite: true }
];

erectorSet.build(questions, templates);
/*
    // build passes the set of answers down the promise chain
    .then((answers) => {
        console.info(answers);
    });
*/