/**
 * @author torreyr
 *
 * Provides functionality for parsing java source.
 *
 */
(function() {

    const lex       = require('./java-lexer');
    const util      = require('../../util');
    const type      = require('../../type');
    const parseUtil = require('../parse-util');

    // Alias parse-util functions for easy access
    const next        = parseUtil.next;
    const peek        = parseUtil.peek;
    const chomp       = parseUtil.chomp;
    const until       = parseUtil.until;
    const chompUntil  = parseUtil.chompUntil;
    const chompBraces = parseUtil.chompBraces;

    /**
    * Parses java source code to find table relations from annotations.
    *
    * @param   {string} source java source code
    * @returns {array}         parse tree
    */
    module.exports = (source) => {
        // We call the parse utility function
        let [tks, tree] = parseUtil.parse(
            lex(source),     // The lexed tokens
            entityTableClass // The only production allowed at the start of a
        );                   // file is entityTableClass
        return tree;
    };

    /**
     * Production for entityTableClass. This is defined as a class preceeded
     * by two annotations, the Entity and Table annotation. Throws a ParseError
     * if the production fails.
     *
     * @param   {array} tks the token stream to parse
     * @returns {array}     parse tree
     */
    const entityTableClass = (tks) => {

        let classBody; // used alter to store the tokens contained by the class
        let node;      // the token we will place our class tokens within

        // Parse all annotations
        while(next(tks, 'annotation')) {

            tok = peek(tks);
            // If the class is annotated with the @Table annotation we use
            // the name parameter of the annotation as the table name
            if(tok.source === '@Table') {
                [tks, node] = annotation(tks, 'Table', ['name']);
                if(!node) return false;
                node = node.name;
            // We throw away all other annotations
            } else {
                if(!annotation(tks, tok.source)) return false;
            }
        }

        // Guarantee this is a class definition
        if(!chompUntil(tks, 'keyword', 'class', [
            ['keyword'],                        // We need to allow any
            ['annotation'],                     // specifiers to preceed the
            ['identifier'],                     // class definition. This
            ['operator', '='],                  // includes other annotations
            ['string'],
            ['seperator'],
            ['brace', '('],
            ['brace', ')']
        ])) return false;
        // If the class was not annotated with the table name we assume the class
        // name is the table name
        if(!node) {
            node = chomp(tks);
        }
        // We expect a curly brace to proceed a class definition, but we want
        // to skip any tokens that qualify the class definition such as
        // interfaces or generics specifiers
        if(!until(tks, 'brace', '{')) return false;
        // We want to parse the contents of the class
        [tks, node.children] = parseUtil.parse(
            chompBraces(tks, '{', '}'), // This will properly collect the tokens
                                        // contained by the class
            // Productions
            entityTableClass,           // Handle inner classes
            relation                    // Check for relations
        );
        if(!node.children) return false;
        // If we have reached here our parse was successful and we can return
        // our array of return tokens.
        return [tks, node];
    };

    /**
     * Production for relation. This is defined by a relationship annotation as
     * well as a join annotation followed by a specified identifier. Throws a
     * ParseError if the production fails.
     *
     * @param   {array} tks the token stream to parse
     * @returns {array}     parse tree
     */
    const relation = (tks) => {

        let relationship = 0;  // The number of relationships
        let node         = []; // The return value nodes
        let joined;            // A flag indicating the JoinColumn annotation
        let tok;               // Token variable
        let ident1;            // First identifier
        let ident2;            // Second identifier

        // Parse all annotations
        while(next(tks, 'annotation')) {

            tok = peek(tks);

            // Check and indicate if a relationship annotation is found
            if(
                tok.source === '@ManyToOne' ||
                tok.source === '@OneToMany' ||
                tok.source === '@OneToOne'
            ) {
                relationship++;
            // We do not care about Many to Many relationships for foreign keys
            // so we discard any relations with this annotation
            } else if(tok.source === '@ManyToMany') {
                return false;
            // Parse the data from the JoinColumn annotation
            } else if(tok.source === '@JoinColumn') {
                // The JoinColumn annotation is allowed to have either a name
                // and referencedColumnName parameters or just name
                [tks, tok] = parseUtil.parseFirst(tks,
                    (tks) => annotation(tks, 'JoinColumn', ['name', 'referencedColumnName']),
                    (tks) => annotation(tks, 'JoinColumn', ['name'])
                );
                // If we succesfully parsed an annotation we add it to node
                if(!tok) return false;
                joined = true;
                node.push(tok);
                continue;
            }
            if(!annotation(tks, tok.source)) return false;;
        }
        // We failed to find the correct annotations
        if(relationship != 1 || !joined) return false;
        // Find the second last parameter ie. the Class name
        while(tok = chomp(tks) && peek(tks)) {
            // Shift identifiers
            if(tok.type === 'identifier') {
                ident2 = util.dataCopy(ident1);
                ident1 = tok;
            }
            // Handle generics
            if(tok.source === '<') {
                ident2 = ident1;
                break;
            }
            // End when we hit a terminator or assignment
            if(tok.type === 'terminator' || tok.type === 'operator') {
                break;
            }
        }
        node.push(ident2);
        return [tks, node];
    };

    /**
     * Generic production for annotation. Can retrieve any of the data from an
     * annotation. Throws a ParseError if the production fails.
     *
     * Takes a name that specifies the annotation like @name. The @ sign should
     * NOT be included. It also takes an array of strings. These are matched
     * against the annotation arguments. When a match is found (in any order)
     * an entry is added to the return object at { field : string-token }.
     *
     * @param   {array}  tks    the token stream to parse
     * @param   {string} name   annotation name
     * @param   {array}  fields annotation arguments to aprse
     * @returns {object}        found field values (tokens)
     */
    const annotation = (tks, name, fields=[]) => {

        const allowed = [
            ['number'],
            ['string'],
            ['boolean'],
            ['identifier'],
            ['dot'],
            ['annotation'],
            ['operator'],
            ['seperator']
        ];
        let values  = {};
        let tok;

        // Consume the annotation name
        if(!chomp(tks, 'annotation', name[0] === '@' ? name : '@' + name)) return false;

        // Check if we need to parse parameters
        if(next(tks, 'brace', '(')) {
            chomp(tks);
            while(fields.length) {

                tok = tok || chomp(tks, 'identifier');

                if(fields.includes(tok.source)) {
                    if(!chomp(tks, 'operator', '=')) return false;
                    if(!(values[tok.source] = chomp(tks, 'string'))) return false;
                    fields = fields.filter(f => f !== tok.source);
                }
                if(fields.length) {
                    if(!(tok = chompUntil(tks, 'identifier', false, allowed))) return false;
                }
            }
            if(!chompUntil(tks, 'brace', ')', allowed)) return false;
        // Check if we failed to parse any fields
        } else if(fields.length) return false;
        return [tks, values];
    };

})();

if(typeof __file__ === 'function') __file__('java-parser');