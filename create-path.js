//TODO project this

module.exports = (sep = '/') => (obj, path, value = null, overwrite = false) => {
    let raw_path = path;
    path = typeof path === 'string' ? path.split(sep) : path;
    let current = obj;
    while (path.length > 1) {
        const [head, ...tail] = path;
        path = tail;
        if (current[head] === undefined) {
            current[head] = {};
        }
        current = current[head];
    }
    if (!overwrite && current.hasOwnProperty(path[0])) throw new TypeError(`can not overwrite path:${raw_path}`);
    current[path[0]] = value;
    return obj;
};

//
// let obj = createPath({}, 'a/b/c', 1);
// obj = createPath(obj, ['d', 'e'], 2);
// expect(obj).toEqual({
//     a: {
//         b: {
//             c: 1
//         }
//     },
//     d: {
//         e: 2
//     }
// });
