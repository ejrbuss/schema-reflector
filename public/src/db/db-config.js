/**
 *  @author ejrbuss
 *
 * Provides functionality for connection to a mysql database.
 */
(function() {

    const mysql = require('mysql');
    const util  = require('../util');
    const type  = require('../type');
    const log   = require('../log');

    // Later initialzed with the mysql connection object.
    let connection;

    /**
     * Tests the database connection. Returns a promise. The Promise returns
     * undefined if there are no issues, the promise returns the error if there
     * is one.
     *
     * Defines GET /api/connection/test
     *
     * Server and Client compliant.
     *
     * @returns {Promise} Sends error if it exsists
     */
    let test = util.app.get('/api/connection/test', (args, resolve) => {

        log.info('Testing database connection...');

        connection.query('SHOW TABLES;', err =>
            err
                ? (log.warn('Failed to connect to database', err), resolve(err))
                : (log.info('Connected to database'), resolve())
        );
    });
    /**
     * Attempts to connect to a database using the passed in configuration.
     *
     * @param {object} config Configuration object
     */
    let set = util.server((config) => {

        // Type check
        type(config).assert.object;

        // Logging
        log.info('Connection reset');

        typeof module.exports.onchange === 'function' && module.exports.onchange();
        connection = mysql.createConnection(config);
    });

    module.exports = util.extend(() => connection, { test, set });

})();

if(typeof __file__ === 'function') __file__('db-config');