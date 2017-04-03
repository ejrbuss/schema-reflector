/**
 * @author ejrbuss
 *
 * Allows require and module.exports to function like in Node on the client
 * side. Requires that the magic function __file__ is called at the end of the
 * file, and that the module content be wrapped in a closure.
 *
 *
 */
let __file__;

let module = { exports : {} };

const require = (function() {

    const modules = {};

    /**
     * Secret function for establishing what file the current module.exports
     * belongs to.
     *
     * @param {string} file the name or path to the file
     */
    __file__ = (f) => {
        if(module.exports) {
            modules[pathToName(f)] = module.exports;
        }
        module.exports = {};
    };

    /**
     * Get the module at the pathname of the given path or an empty object.
     *
     * @param   {string} file   path to the file
     * @returns {object} module
     */
    const require = f => modules[pathToName(f)] || {};
    /**
     * Converts a path to the final name and removes file extensions.
     *
     * @param   {string} path path to file
     * @returns {string} name
     */
    let pathToName = p =>
        (p = p.replace(/\.js$/, '').split(/[/\\]/g), p[p.length - 1]);

    return require;

})();
