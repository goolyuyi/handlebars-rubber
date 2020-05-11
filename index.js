const fs = require('fs');
const path = require('path');
const Handlebars = require("handlebars");
const globby = require('globby');
const assert = require('assert');
const pathToObjectTree = require('./create-path')('/');
const mixin = require('mixin-deep');

function loadWithDeal(loadFunc, pattern = "**") {
    return async function (fileOrDirPath, namePrefix) {
        let res = {};
        let stat = await fs.promises.stat(fileOrDirPath);
        if (stat.isDirectory()) {
            const gl = await globby(pattern, {cwd: path.resolve(fileOrDirPath)});

            //parallel load
            await Promise.all(gl.map(async (i) => {
                let name = path.parse(i);
                name = path.join(namePrefix, name.dir, name.name);
                let ret = await loadFunc(name, path.resolve(fileOrDirPath, i));
                if (ret && Object.keys(ret).length !== 0 && ret.constructor === Object)//is not empty obj
                    mixin(res, ret);
            }));
        } else {
            let name = path.parse(fileOrDirPath);
            res = await loadFunc(name.name, path.resolve(fileOrDirPath))
        }

        //TODO: if res isnot {}
        return res;
    }
}

function loadWithPaths(dealFunc) {
    return async (paths, prefixName = '') => {
        assert(paths);
        if (Array.isArray(paths)) {
            let res = {};
            await Promise.all(paths.map(async (i) => {
                let ret = await dealFunc(i, prefixName);
                if (ret && Object.keys(ret).length !== 0 && ret.constructor === Object)//is not empty obj
                    res = mixin(res, ret);
            }))
            return res;
        } else if (typeof paths === 'string') {
            return await dealFunc(paths, prefixName);
        } else {
            throw new TypeError(`paths must be a string or array`);
        }
    }
}

/**
 * @function
 * @param paths {string|Array<string>}
 * @param {String} namePrefix
 */
const loadPartials = loadWithPaths(loadWithDeal((name, path) => {
    Handlebars.registerPartial(name, require(path))
}, '**'));

/**
 * @function
 * @param paths {string|Array<string>}
 * @param {String} namePrefix
 */
const loadHelpers = loadWithPaths(loadWithDeal((name, path) => {
    Handlebars.registerHelper(name, require(path))
}, '**.js'));

/**
 * @function
 * @param paths {string|Array<string>}
 * @return {Object} params
 * @param {String} namePrefix
 */
const loadConfs = loadWithPaths(loadWithDeal((name, path) => {
    let val = require(path);
    return pathToObjectTree({}, name, val, false);
}, '**'));

/**
 * @function
 * @param paths {string|Array<string>}
 * @return {Object} params
 * @param {String} namePrefix
 */
const loadPlainText = loadWithPaths(loadWithDeal(async (name, path) => {
    let val = await fs.promises.readFile(path, 'utf-8');
    return pathToObjectTree({}, name, val, false);
}, '**'));

module.exports.loadHelpers = loadHelpers;
module.exports.loadPartials = loadPartials;
module.exports.loadConfs = loadConfs;
module.exports.loadPlainText = loadPlainText;
