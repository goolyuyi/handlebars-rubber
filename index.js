const fs = require('fs');
const path = require('path');
const globby = require('globby');
const pathToObjectTree = require('./create-path')('/');
const mixin = require('mixin-deep');

function loadWithDeal(loadFunc) {
    return async function (glob = "**", cwd, namePrefix = '') {

        cwd = cwd || process.cwd();
        const gl = await globby(glob, {cwd: path.resolve(cwd)});

        //parallel load
        await Promise.all(gl.map(async (i) => {
            let name = path.parse(i);
            name = path.join(namePrefix, name.dir, name.name);
            await loadFunc(name, path.resolve(cwd, i));
        }));
    }
}

/**
 * @function
 * @param {Handlebars} handlebars
 * @param {String|Array<String>} glob
 * @param {String} cwd
 * @param {String} namePrefix
 */
const loadPartials = async function (handlebars, glob, cwd, namePrefix) {
    await loadWithDeal((name, path) => {
        handlebars.registerPartial(name, require(path))
    })(glob, cwd, namePrefix);
}

/**
 * @function
 * @param {Handlebars} handlebars
 * @param {String|Array<String>} glob
 * @param {String} cwd
 * @param {String} namePrefix
 */
const loadHelpers = async function (handlebars, glob, cwd, namePrefix) {
    await loadWithDeal((name, path) => {
        handlebars.registerHelper(name, require(path))
    })(glob, cwd, namePrefix);
}

/**
 * @function
 * @param {String|Array<String>} glob
 * @param {String} cwd
 * @param {String} namePrefix
 */
const loadJsonData = async function (glob, cwd, namePrefix) {
    let res = {};
    await loadWithDeal((name, path) => {
        let val = require(path);
        mixin(res, pathToObjectTree({}, name, val, false));
    })(glob, cwd, namePrefix);
    return res;
}
/**
 * @function
 * @param {String|Array<String>} glob
 * @param {String} cwd
 * @param {String} namePrefix
 */
const loadPlainTextData = async function (glob, cwd, namePrefix) {
    let res = {};
    await loadWithDeal(async (name, path) => {
        let val = await fs.promises.readFile(path, 'utf-8');
        mixin(res, pathToObjectTree({}, name, val, false));
    })(glob, cwd, namePrefix);
    return res;
}

module.exports.loadHelpers = loadHelpers;
module.exports.loadPartials = loadPartials;
module.exports.loadJsonData = loadJsonData;
module.exports.loadPlainTextData = loadPlainTextData;

class Rubber {
    constructor(handlebars) {
        this._handlebars = handlebars;
        this._data = {};
    }

    get handlebars() {
        return this._handlebars
    }

    get data() {
        return this._data
    }

    async loadHelpers(glob, cwd, namePrefix) {
        await loadHelpers(this._handlebars, glob, cwd, namePrefix);
    }

    async loadPartials(glob, cwd, namePrefix) {
        await loadPartials(this._handlebars, glob, cwd, namePrefix);
    }

    async loadJsonData(glob, cwd, namePrefix) {
        mixin(this._data, await loadJsonData(glob, cwd, namePrefix));
    }

    async loadPlainTextData(glob, cwd, namePrefix) {
        mixin(this._data, await loadPlainTextData(glob, cwd, namePrefix));
    }

}

module.exports=Rubber;
