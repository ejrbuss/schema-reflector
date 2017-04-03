/**
 * @author ejrbuss
 *
 * Provides functionality for lexing java source.
 */
(function() {

    const util  = require('../../util');

    // A Heuristically chosen set of tokens. These are mainly to allow for
    // reasonably powerful regex parsing. This is still naive and will likely
    // have issues in certain contexts.
    const tokens = {
        whitespace : /^\s+/,
        comment    : /^(\/\/.*|\/\*(.|\s)*?\*\/)/,
        keyword    : /^(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)/,
        operator   : /^(\+\+|--|\+|-|~|!|\*|\/|%|<<|>>|>>>|<|>|<=|>=|instanceof|==|!=|&|\^|\||&&|\|\||\?|:|=|\+=|-=|\*=|\/=|%=|&=|^=|<<=|>>=|>>>=)/,
        brace      : /^(\(|\)|\[|\]|\{|\})/,
        string     : /^("([^"\\]|\\.)*")|('([^'\\]|\\.)*')/,
        number     : /^(0x|0X|0b|0B)?(\d+|\d?\.\d+)L?/,
        boolean    : /^(true|false)/,
        seperator  : /^,/,
        terminator : /^;/,
        dot        : /^\./,
        annotation : /^@[$a-zA-Z_]\w*/,
        identifier : /^[$a-zA-Z_]\w*/
    };

    /**
     * Constructs a new Token.
     *
     * @param   {string} current the current source being lexed
     * @param   {string} name    the token type
     * @returns {object}         the token
     */
    const token = (current, name) => {
        return {
            type   : name,
            source : tokens[name]
                .exec(current)[0]
                .trim()
                .replace(/^"|^'|"$|'$/g, '')
        };
    }
    /**
     * If there is no @joinColumn sign there is no point looking at the file.
     *
     * @param   {string}  source
     * @returns {boolean}
     */
    const quickCheck = (source) => {
        return source.includes('@JoinColumn')
            ? source
            : '';
    }
    /**
     * Heuristically lexes Java source code. This is not a fullq qualified lex
     * nor does it use standard qualified nameing for tokens. Instead this lexer
     * provides sufficient power to be confident about the context of class
     * definitions and annotations, which are necessary for the parsing step.
     *
     * By default filters whitespace and comments.
     *
     * @param   {string} source the java source to lex
     * @param   {array}  filter a list of token types to filter out
     * @returns {array}         the lexed token stream
     */
    module.exports = (source, filter=['whitespace', 'comment', 'number', 'boolean']) => {

        let toLex = quickCheck(source);
        let toks  = [];

        lexer : while(toLex.length) {
            for(let name of Object.keys(tokens)) {
                if(toLex.match(tokens[name])) {
                    toks.push(token(toLex, name));
                    toLex = toLex.replace(tokens[name], '');
                    continue lexer;
                }
            }
            let line = source.split('\n').length - toLex.split('\n').lengthl
            let char = source.length- toLex.length;
            throw new Error('Unknown character sequence ' + util.trunc(toLex, 64, false) + '@' + line + ':' + char);
        }
        return toks.filter(tok => !filter.includes(tok.type));
    }

})();

if(typeof __file__ === 'function') __file__('java-lexer');