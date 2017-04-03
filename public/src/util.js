/**
 * @author ejrbuss
 *
 * An assortment of useful functions and variables.
 */
(function() {

    const type = require('./type');

    const util = {
        // Constants
        __node__ : typeof window === 'undefined',
        __port__ : void 0,
        __app__  : void 0
    };

    const app = {
        /**
         * Creates a GET route where the handler function is run on the server
         * but called on the client. Url parameters are passed to the handler
         * function.
         *
         * @param   {string}   path the url path
         * @param   {function} fn   the handler
         * @returns {function} the server/client function
         */
        get(path, fn) {
            util.__app__ && util.__app__.get(path, (req, res) => {
                log.info('Request GET: ' + path);
                new Promise(resolve => fn(req.params, resolve))
                    .then(data => {
                        log.info('Response GET: ' + path);
                        res.send(data);
                    })
                    .catch(err => {
                        log.warn('Error response GET: ' + path, err);
                        res.send(err);
                    });
            });
            return util.__node__
                ? (args) => new Promise(resolve => fn(args, resolve))
                : () => new Promise(resolve => $.get(path, resolve))
        },
        /**
         * Creates a POST route where the handler function is run on the server
         * but called on the client. POST parameters are passed to the handler.
         *
         * @param   {string}   path the url path
         * @param   {function} fn   the handler
         * @returns {function} the server/client function
         */
        post(path, fn) {
            util.__app__ && util.__app__.post(path, (req, res) => {
                log.info('Request POST: ' + path, req.body);
                new Promise(resolve => fn(req.body && req.body.args, resolve))
                    .then(data => {
                        log.info('Response POST: ' + path);
                        res.send(data)
                    })
                    .catch(err => {
                        log.warn('Error response POST: ' + path, err);
                        res.send(err);
                    })
            });
            return util.__node__
                ? (args) => new Promise((resolve) => fn(args, resolve))
                : (args) => new Promise(resolve => $.ajax({
                    data        : JSON.stringify({ args : args }),
                    url         : path,
                    contentType : 'application/json',
                    type        : 'POST',
                    success     : resolve
                }));
        }
    };
    /**
     * Returns a hash of an object. Based of JACA hashchode. Objects have their
     * JSON.stringify hased.
     *
     * @param   {mix}    object object to hash
     * @returns {number}        hash value
     */
    const hash = (object) => {
        let source = type(object).object
            ? JSON.stringify(object)
            : object.toString();
        let hash = 0;
        for(let i in source) {
            hash = ((hash << 5) - hash) + source.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    };
    /**
     * Prints the given expression and then returns it value. By default
     * objects will print their JSON.strinfigy output.
     *
     * @param   {mixed}     expression   an expression to print
     * @param   {boolean}   json        true if objects should be printed as
     *                                  JSON
     * @returns {mixed}
     */
    const print = (o, json=true) => {
        console.log(type(o).object && json
            ? JSON.stringify(o, null, 4)
            : o
        );
        return o;
    };
    /**
     * Truncates a string.
     *
     * @param   {string} string stirng to truncate
     * @param   {length} n      length to truncate to
     * @returns {string}        truncated string
     */
    const trunc = (string, n, html=true) => {
        return (string.length > n) ? string.substr(0, n - 1) + (html ? '&hellip;' : '...') : string;
    };
    /**
     * Deep extends. Adds all properties of b to a as well as to b's children.
     *
     * @param   {object} a object to extend
     * @param   {object} b object with new properties
     * @returns {object}   a
     */
    const extend = function extend(a, b) {
        for (let property in b) {
            if (type(b[property]).object && !type(b[property]).array) {
                a[property] = a[property] || {};
                extend(a[property], b[property]);
            } else {
                a[property] = b[property];
            }
        }
        return a;
    };
    /**
     * Fixes Prototype and constructor properties on new constructor
     * functions.
     *
     * @param   {function}  function    constructor function
     * @returns {function}
     */
    const constructor = (fn, parent) => {
        fn.prototype = Object.create(parent.prototype);
        fn.prototype.constructor = fn;
        return fn;
    };
    /**
     * Returns a new function that will only execute the given function
     * once.
     *
     * @param   {function}  function    the function to run once
     * @returns {function}
     */
    const once = (fn) => {
        return (...args) =>
            (fn(...args), fn = nop);
    };
    /**
     * Only allow function to be run on the server.
     *
     * @param   {function}  serverside function
     * @return  {function}
     */
    const server = (fn) => {
        return util.__node__
            ? fn
            : () => {
                throw new Error('function is only available on the server.');
            };
    };
    /**
     * Only allow function to be run on the client.
     *
     * @param   {function}  client function
     * @return  {function}
     */
    const client = (fn) => {
        return !util.__node__
            ? fn
            : () => {
                throw new Error('function is only available on the client.');
            };
    };
    /**
     * Returns true if objects a and b contain the same data.
     *
     * @param   {object} a first object
     * @param   {object} b second object
     * @returns {boolean}  whether the two object contain equivalent data
     */
    const dataEqual = (a, b) => {
        return JSON.stringify(a) === JSON.stringify(b);
    };
    /**
     * Returns a copy of the data contained by a.
     *
     * @param   {object} a object to copy
     * @returns {object}   copy
     */
    const dataCopy = (a) => {
        return type(a).undefined 
            ? undefined
            : JSON.parse(JSON.stringify(a));
    };
    /**
     * Returns true if two sets, a and b, intersect.
     *
     * @param   {object} a first set
     * @param   {object} b second set
     * @returns {boolean}  whether a and b intersects
     */
    const intersects = (a, b) => {
        type(a).assert.array;
        type(b).assert.array;
        return a.some(i => b.indexOf(i) !== -1)
            || b.some(i => a.indexOf(i) !== -1);
    };
    /**
     * Removes all non-unique entires from an array.
     *
     * @param   {array} a the array
     * @returns a new array with only unique items
     */
    const unique = (a) => {
        type(a).assert.array;
        return Object.keys(a.reduce((set, i) => (set[i] = true, set), {}));
    };
    /**
     * Flattens an array.
     *
     * @param   {array} a the array
     * @returns a new flat array
     */
    const flatten = (a) => {
        type(a).assert.array;
        return Array.prototype.concat.apply([], a);
    };
    /**
     * Iterates a function until that function indicates it is stable by not
     * calling the sttability function passed to it.
     *
     * @param {function} fn the iteratee
     */
    const untilStable = (fn) => {
        let stable = false;
        while(!stable) {
            stable = true;
            fn(() => stable = false);
        }
    };
    /**
     * No Operation.
     */
    const nop = () => {};

    /**
     * Redirect with an optional delay set to a default of 300.
     *
     * @param {string} url   the url to redirect to
     * @param {number} delay the time to delay
     */
    const redirect = client((url, delay=300) => {
        type(url).assert.string;
        $(document).delay(delay).queue(() => location.href = url);
    });

    module.exports = extend(util, {
        app,
        hash,
        print,
        trunc,
        extend,
        constructor,
        once,
        server,
        client,
        dataEqual,
        dataCopy,
        intersects,
        unique,
        flatten,
        untilStable,
        nop,
        redirect
    });

    // Load late to avoid double require weirdness
    const log  = require('./log');

})();

if(typeof __file__ === 'function') __file__('util');