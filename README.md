# erector-set
A tool for creating project generators

## To used

Install this package

```console
npm i -S erector-set
```

And include in a file

```javascript
const erectorSet = require('erector-set');

// questions is an array of questions to ask
// files is the list of template files to perform replacements on
erectorSet.build(questions, files)
    .then((answers) => { /* do something with answers */ });
```

## Provided methods

* `build(questions, files)`: asks the provided `questions`, performs string replacements on
    templates based on those answers, then outputs those files; returns a Promise
* `construct(answers, files)`: function to perform string replacement on template `files` based on the `answers`
* `inquire(questions)`: tool used by `build` to ask `questions`; returns a Promise