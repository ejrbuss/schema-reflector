/**
 * @author ejrbuss
 *
 * Provides functions for accessing data about the OSCAR database schema. This
 * includes tables and columns. Additionally this file is responsible for
 * munging the data provided by SQL queries into a useable format.
 */
(function() {

    const connection = require('./db-config');
    const query      = require('./db-promise');
    const util       = require('../util');
    const log        = require('../log');

    /**
     * Provides an array of all columns in the OSCAR database. Each object
     * in the array provides details on the column, table, and key status.
     * This query can take awhile the first time it is run on a new
     * connection as SQL reflection is slow. Results are returned via a
     * Promise.
     *
     * Defines GET /api/columns
     *
     * @returns {Promise}
     */
    const columns = util.app.get('/api/columns', (args, resolve) =>
        query('column-query')
            .then(resolve)
            .catch(resolve)
    );

    /**
     * Provides an array of all relations in the OSCAR database. Each object
     * in the array provides the foreign column and table as well as the
     * table and column it relates to. Results are returned via a Promise.
     *
     * Defines GET /api/relations
     *
     * @returns {Promise}
     */
    const relations = util.app.get('/api/relations', (args, resolve) =>
        query('relation-query')
            .then(resolve)
            .catch(resolve)
    );

    /**
     * Provides an array of all tables in the OSCAR database. Results are
     * returned via a Promise.
     *
     * Defines GET /api/tables
     *
     * @returns {Promise}
     */
    const tables = util.app.get('/api/tables', (args, resolve) =>
        query('table-query')
            .then(r => r.map(o => o[Object.keys(o)[0]]))
            .then(resolve)
            .catch(resolve)
    );
    /**
     * Provides an object containing munged schema data. This includes all
     * tables with their respective columns in an items array as well as
     * all relations. Resutls are returned via a Promise.
     *
     * Defines GET /api/schema
     *
     * @returns {Promise}
     */
    const schema = util.app.get('/api/schema', (args, resolve) => {
        Promise.all([
            module.exports.columns(), module.exports.relations()
        ])
        .then(([cols, rels]) => {
            let tables = cols.reduce((tables, col) => {
                (tables[col.table] || (tables[col.table] = [])).push(col);
                return tables;
            }, {});
            tables = Object.keys(tables).reduce((array, table) => {
                array.push({
                    key   : table,
                    items : tables[table]
                });
                return array;
            }, []);
            return {
                relations : rels,
                tables    : tables
            };
        })
        .then(resolve)
        .catch(resolve)
    });

    module.exports = { columns, relations, tables, schema };

})();

if(typeof __file__ === 'function') __file__('schema');