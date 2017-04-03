/**
 * @auther ejrbuss
 *
 * Provides a new query function that reads SQL queroes from files and returns a
 * Promise. Additionally these queries are setup to read from backup data if the
 * database connection is not live.
 */
(function() {

    const fs         = require('fs');
    const type       = require('../type');
    const util       = require('../util');
    const log        = require('../log');
    const connection = require('./db-config');
    const user       = require('../user/user');

    module.exports = util.server((query) => {

        // Type Check
        type(query).assert.string;

        return new Promise((resolve, reject) => {
            if(user.cache(query)) {
                log.info('Cache hit for query: ' + query);
                resolve(user.cache(query));
            }
            let sql = fs.readFileSync('./public/src/db/queries/' + query + '.sql', 'utf8');

            connection.test().then(err => {
                if(err) {
                    log.warn('Query failed: reading from backup data');
                    resolve(JSON.parse(fs.readFileSync('./public/src/db/queries/' + query + '.json', 'utf8')));
                }
                connection().query(sql, [user.config().database], (err, res) => {
                    log.info('Query succeeded.');
                    resolve(user.cache(query, res));
                });
            }).catch(resolve);
        });
    });

})();

if(typeof __file__ === 'function') __file__('db-promise');
