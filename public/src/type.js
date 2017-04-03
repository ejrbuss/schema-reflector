/**
 * @author ejrbuss
 *
 * Provids a set of functions for testing and asserting variable types. Checks
 * must be synchronous(executed all in one function) to avoid messaging errors.
 * This small library is well tested from previous projects.
 */
(function() {

    let value;
    let message;

    /**
     * Starts a new type sequence, returns itself.
     *
     * @param   {mixed}     value   the type value
     * @param   {string}    message the message to throw in a TypeError
     * @returns {function}
     */
    let type = (v, m) => (value = v, message = m, type);

    type.assert = {};

    /**
     * Construct a typeof check for each type as properties on the type function.
     * Assert those checks as prioerties on the type.assert object.
     */
    'undefined boolean number string symbol function'
        .split(' ')
        .forEach(function(name) {
            Object.defineProperty(type, name, {
                get() {
                    return typeof value === name;
                }
            });
            Object.defineProperty(type.assert, name, {
                get() {
                    if(!type[name]) {
                        throw new TypeError(message || 'Expected ' + name + ' instead found ' + typeof value);
                    }
                    return type.assert;
                }
            });
        });

    /**
     * Construct proper checks for integers, objects, arrays, and empty
     * object/arrays as properties on the type function.
     */
    Object.defineProperties(type, {
        integer : { get() {
            return typeof value === 'number' && !isNaN(value) && (value | 0) === value;
        }},
        object : { get() {
            return typeof value === 'object' && !!value;
        }},
        array : { get() {
            return Object.prototype.toString.call(value) === '[object Array]';
        }},
        empty : { get() {
            return type.oflength(0);
        }}
    });
    /**
     * Construct assert checks for integers, objects, arrays, and empty
     * object/arrays as properties on the type.assert object.
     */
    Object.defineProperties(type.assert, {
        integer : { get() {
            if(!type.integer) {
                throw new TypeError(message || 'Expected integer instead found ' + typeof value);
            }
            return type.assert;
        }},
        object : { get() {
            if(!type.object) {
                throw new TypeError(message || 'Expected object instead found ' + typeof value);
            }
            return type.assert;
        }},
        array : { get() {
            if(!type.array) {
                throw new TypeError(message || 'Expected array instead found ' + typeof value);
            }
            return type.assert;
        }},
        empty : { get() {
            if(!type.empty) {
                throw new TypeError(message || 'Expected empty value instead found value with length ' + Object.keys(value).length);
            }
            return type.assert;
        }}
    });
    /**
     * Returns true if the type value is an instance of the passed in
     * constructor.
     *
     * @param   {function} constructor
     * @returns {boolean}
     */
    type.instanceof = function(constructor) {
        return value instanceof constructor;
    };
    /**
     * Asserts that the type value is an instance of the passed in constructor.
     * If the assertion fails a TypeError is thrown otherwise type.assert is
     * returned.
     *
     * @param   {function} constructor
     * @returns {object}
     */
    type.assert.instanceof = function(constructor) {
        if(!type.instanceof(constructor)) {
            throw new TypeError('Expected instanceof ' + constructor.name + ' instead found ' + value);
        }
        return type.assert;
    };
    /**
     * Returns true if the type value has a length equal to the passed in value.
     *
     * @param   {number} n
     * @returns {boolean}
     */
    type.oflength = function(n) {
        return Object.keys(value).length === n;
    };
    /**
     * Asserts that the type value has a length equal to the passed in value. If
     * the assertion fails a TypeError is thrown otherwise type.assert is
     * returned.
     *
     * @param   {number} n
     * @returns {object}
     */
    type.assert.oflength = function(n) {
        if(!type.oflength(n)) {
            throw new TypeError(message || 'Expected value with length ' + n + ' instead found value with length ' + Object.keys(value).length);
        }
        return type.assert;
    };

    module.exports = type;

})();

if(typeof __file__ === 'function') __file__('type');
