/**
 * @author ejrbuss
 *
 * Provides a logging object that can emit messages depending on the currently
 * set logger level.
 */
(function() {

    const util = require('./util');

    /**
     * Logging levels. On DEBUG all logging messages are shown. On NONE no
     * levels are tracked.
     */
    const levels = {
        DEBUG : 4,
        INFO  : 3,
        WARN  : 2,
        NONE  : 1
    };

    /**
     * Changes logger to a logger which will emit logs depending on the given
     * logging level. Returns itself.
     *
     * Server and Client compliant.
     *
     * @param   {number}    Level
     */
    let logger = level => {
        logger.debug = level >= levels.DEBUG
            ? log('DEBUG', '#0000FF')
            : util.nop;
        logger.info  = level >= levels.INFO
            ? log('INFO', '#00C864')
            : util.nop;
        logger.warn  = level >= levels.WARN
            ? log('WARN', '#C80164')
            : util.nop;
        logger.info('Logging level set to ' + Object.keys(levels)[4 - level]);
        return logger;
    }
    /**
     * Returns a logging function that will emit messages in the given color if
     * on the Client. On the Server messages are just printed as normal.
     * Messages will be prefixed with their logging level.
     *
     * Server and Client compliant.
     *
     * @param   {string}    text  name of logging level
     * @param   {color}     color text color
     * @returns {function}
     */
    const log = (level, color) =>
        (...args) => {
            let time   = new Date().toLocaleTimeString();
            let caller = new Error().stack
                .split('\n')[2]
                .trim()
                .replace(/^.*\\/, '');
            util.__node__
                ? console.log(`\n${level}: ${time} ${caller}`)
                : console.log(`%c${level}: ${time} ${caller}`, 'color:' + color);
            for(arg of args) {
                console.log(arg);
            }
            return args[args.length - 1];
        };

    module.exports        = util.__node__ ? logger : logger(levels.DEBUG);
    module.exports.levels = levels;

})();

if(typeof __file__ === 'function') __file__('log');
