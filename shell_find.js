'use strict';

const exec = require('child_process').exec;
const escape = require('shell-escape');

const shellFind = {

    name: function (pattern) {
        this._command.push('-name', pattern);

        return this;
    },

    prune: function (pattern) {
        this._command.unshift('-name', pattern, '-prune', '-o');

        return this;
    },

    newer: function (filepath) {
        this._command.push('-newer', filepath);

        return this;
    },

    type: function (filetype) {
        this._command.push('-type', filetype[0]);

        return this;
    },

    command: function () {
        return escape(['find', this.rootDir].concat(this._command, '-print'));
    },

    follow: function () {
        this._command.push('-follow');

        return this;
    },

    exec: function (callback) {
        exec(this.command(), this.options, (err, stdout, stderr) => {
            if (stderr) {
                const lines = stderr.split('\n');
                let error;
                lines.forEach((line) => {
                    if (line.length > 0 && line.indexOf('find: File system loop detected;') !== 0) {
                        error = stderr;
                    }
                });
                if (error) {
                    return callback(error);
                }
            }

            const files = stdout.split('\n');
            if (files[files.length - 1] === '') {
                files.pop(); // trailing newline
            }

            return callback(null, files);
        });
    },
};

module.exports = function (rootDir, options) {
    const finder = Object.create(shellFind);
    finder._command = [];
    finder.rootDir = '.';
    finder.options = options;
    switch (typeof options) {
        case 'object':
            finder.options = options;
            break;
        default:
            finder.options = {};
            break;
    }
    switch (typeof rootDir) {
        case 'string':
            finder.rootDir = rootDir;
            break;
        case 'object':
            finder.options = rootDir;
            break;
        default:
            break;
    }
    if (finder.options.env === undefined) {
        finder.options.env = {};
    }
    finder.options.env.LANG = 'C';

    return finder;
};
