/**
 * @author ejrbuss
 *
 * Provides utility functions for parsing java tokens.
 */
(function() {

    const util = require('../util');
    const type = require('../type');

    /**
     * Parses a token stream. Takes the token stream to parse as well as a set
     * of productions (functions). If a function does not throw a ParseError
     * its return value is added to a array which is returned after parsing.
     * Productions are parsed with precedence corresponding to the order they
     * were passed in. If all productions fail the next token in the token
     * stream is dropped. Errors other than ParseErrors will be thrown.
     *
     * Parse returns the modified token stream as the token stream passed to
     * parse is not garunteed to have been mutated.
     *
     * @param   {array}    tks         a token stream to parse
     * @param   {function} productions any number of production functions, these
     *                                 functions should take a token stream
     * @returns {array, array}         the modified token stream and results
     *                                 array
     */
    const parse = (tks, ...productions) => {

        let tree = [];
        let prod;
        let tmp;

        parsing : while(tks.length) {
            for(production of productions) {
                prod = production(util.dataCopy(tks));
                if(prod) {
                    [tks, tmp] = prod;
                    tree.push(tmp);
                    continue parsing;
                }
            }
            tks.shift();
        }
        return [tks, tree];
    }
    /**
     * Parses the first valid production in a set of tokens. If no productions
     * parse this function returns the token stream. For more details on parsing
     * see parse() documentation.
     *
     * ParseFirst returns the modified token stream as the token stream passed
     * to parse is not garunteed to have been mutated.
     *
     * @param   {array}    tks         a token stream to parse
     * @param   {function} productions any number of production functions, these
     *                                 functions should take a token stream
     * @returns {array, object}        the modified token stream and first
     *                                 parsed tokens
     */
    const parseFirst = (tks, ...productions) => {

        let tmp;

        for(production of productions) {
                tmp = production(util.dataCopy(tks));
            if(tmp) {
                return tmp;
            }
        }
        return [tks, false];
    }
    /**
     * Tests a token to determine if it meets the conditions supplied. The token
     * is taken from the provided token stream at the step provided. If no step
     * is provided the next token in the stream is tested. Type and value can
     * both be substituted with false which indicates they should not be tested.
     *
     * @param   {array}  tks   the token stream to test
     * @param   {string} type  optional the expected type of the token
     * @param   {string} value optional the expected source of the token
     * @param   {int}    step  optional the offset into the token stream
     * @returns {boolean}      true if the token is match
     */
    const next = (tks, type, value, step=0) => {
        if(!tks[step] || (type && tks[step].type !== type)) {
            return false;
        }
        if(value && tks[step].source !== value) {
            return false;
        }
        return true;
    }
    /**
     * Returns the first token in the token stream without consuming it.
     *
     * @param   {array}  tks the token stream
     * @returns {object}     the first token in the token stream
     */
    const peek = (tks) => tks[0];
    /**
     * Garuntees that the next token is a match. Takes the same parameters as
     * next() except it throws a ParseError if the next token does not match.
     * Otherwise it removes the next token from the token stream and returns
     * it.
     *
     * @param   {array}  tks   the token stream to test
     * @param   {string} type  optional the expected type of the token
     * @param   {string} value optional the expected source of the token
     * @param   {int}    step  optional the offset into the token stream
     * @returns {object}       the chomped token
     */
    const chomp = (tks, type, value) => {
        if(next(tks, type, value)) {
            return tks.shift();
        }
        return false;
    }
    /**
     * Chomps tokens until it finds the expected tokens. Takes a list of allowed
     * tokens. If the expected tokens cannot be found, or an unallowed token is
     * found before the expected token until() will return false and the token
     * stream will not be modified. If allowed is left empty all tokens are
     * allowed.
     *
     * Allowed is an array whose items should be of the form: [type, value]
     * These will be tested individually for each token. The second item may
     * left out if only the type should be tested.
     *
     * @param   {array}  tks     the token stream to test
     * @param   {string} type    optional the expected type of the token
     * @param   {string} value   optional the expected source of the token
     * @param   {array}  allowed optional a list of allowed tokens
     * @returns {boolean}        true if the next token in the stream is now the
     *                           expected token and only allowed tokens were
     *                           chomped
     */
    const until = (tks, type, value, allowed=[]) => {

        let step  = 0;
        let valid;

        while(!next(tks, type, value, step)) {
            valid = allowed.length === 0;
            for(let allow of allowed) {
                valid = valid || next(tks, allow[0], allow[1], step);
            }
            if(!valid || ++step >= tks.length) {
                return false;
            }
        }
        while(step-- > 0) {
            chomp(tks);
        }
        return true;
    }
    /**
     * Chomps until the expected token. Takes the same parameters as until()
     * except it will throw a ParseError if the expected token could not be
     * reached. If the token could be reached it will chomp the token and return
     * it.
     *
     * @param   {array}  tks     the token stream to test
     * @param   {string} type    optional the expected type of the token
     * @param   {string} value   optional the expected source of the token
     * @param   {array}  allowed optional a list of allowed tokens
     * @returns {object}         the expected token
     */
    const chompUntil = (tks, type, value, allowed=[]) => {
        if(until(tks, type, value, allowed)) {
            return chomp(tks);
        }
        return false;
    }
    /**
     * Chomps the set of tokens between two braces. Properly counts braces to
     * ensure the tokens are returned when the matching brace is found. Uses
     * until to find the starting brace. Will through a ParseError if the
     * starting brace cannot be found or the nmatching brace cannot be found.
     * Returns the chomped tokens. The surrounding braces are also chomped but
     * not included in the output.
     *
     * @param   {array}  tks     the token stream to test
     * @param   {string} start   the starting brace
     * @param   {string} end     the ending brace
     * @param   {array}  allowed tokens allowed prior to the starting brace
     * @returns {array}          the tokens contained within the braces
     */
    const chompBraces = (tks, start, end, allowed=[]) => {

        let counter = 1;
        let toks    = [];

        chompUntil(tks, 'brace', start, allowed);

        while(counter !== 0) {
            if(tks.length <= 0) {
                return false;
            }
            if(next(tks, 'brace', start)) counter++;
            if(next(tks, 'brace', end)) counter--;
            toks.push(chomp(tks));
        }

        toks.pop();
        return toks;
    }

    module.exports = {
        parse,
        parseFirst,
        next,
        peek,
        chomp,
        until,
        chompUntil,
        chompBraces
    }

})();

if(typeof __file__ === 'function') __file__('parse-util');