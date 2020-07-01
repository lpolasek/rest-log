/**
 * @fileoverview This file contains a function to retrieve a 
 * file lines, in reverse  order an mathing any of the provided
 * filters.
 */

var fsReverse = require('fs-reverse');


/**
 * Return a promise when fullfilled, contains the lines of a
 * file, in reverse order, matching any of the provided filters
 * 
 * @param {string} filename The filename to process
 * @param {int} lineCount The number of lines to fetch, if -1 fetch all lines
 * @param {string[]} filters A collection of strings of words to be matches (OR)
 * 
 * @return promise Content of a file
 */
// processFile('/var/log/pacman.log', 10, ['installed', 'transaction'])
module.exports = function(filename, lineCount, filters) {
    filters = filters || [];
    lineCount = lineCount === undefined ? -1 :  lineCount;
    let lines = [];

    return new Promise((resolve, reject) => {
        let stream = fsReverse(filename);

        stream.on('data', (line) => {
            if ((filters.length > 0) && (!filters.some(filter => line.includes(filter)))) {
                return;
            }
            lines.push(line);
            if(lines.length === lineCount) {
                stream.destroy();
            }
        });

        stream.on('error', (error) => {
            reject(error);
        });

        stream.on('close', () => {
            resolve(lines);
        });
    });
}
