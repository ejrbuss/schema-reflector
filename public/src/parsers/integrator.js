(function() {

    const user   = require('../user/user');
    const util   = require('../util');
    const log    = require('../log');
    const schema = require('../db/schema');
    const parse  = require('./java/java-parser');
    const fs     = require('fs');
    const path   = require('path');

    /**
     *
     */
    module.exports = util.app.get('/api/integrator', (args, resolve) => {
        schema.schema().then(schema => {

            let source = user.config().source;

            try {
                // source is set and is a directory
                if(source && fs.statSync(source).isDirectory()) {

                    // Process all java files
                    for(let file of getJavaFiles(source)) {
                        log.info('Processing: ' + file);
                        parse(fs.readFileSync(file, 'utf-8')).forEach(jclass =>
                            handleClass(jclass, schema)
                        );
                    }
                }
            } catch(err) {
                log.warn(err);
            }

            // Always resolve schema
            resolve(schema);
        });
    });

    function handleClass(jclass, schema) {

        // find the table in schema
        let srcTableName = jclass.source.toLowerCase();
        let srcTable     = schema.tables.find(t =>
            t.key.toLowerCase() === srcTableName
        );
        srcTableName = srcTable && srcTable.key;

        if(srcTable) {
            jclass.children.forEach(child => {

                // Check for nested classes
                if(!Array.isArray(child)) {
                    handleClass(child, schema);
                    return;
                }

                // Get table/column data
                let srcColumnName = child[0].name.source;
                let dstTableName  = child[1].source.toLowerCase();
                let dstColumnName = child[0].referencedColumnName
                    ? child[0].referencedColumnName.source
                    : srcColumnName;

                setColumnFKC(srcTable, srcColumnName);

                // Find dst table
                let dstTable = schema.tables.find(t =>
                    t.key.toLowerCase() === dstTableName
                );
                dstTableName = dstTable && dstTable.key;

                // Check if the relationship already exists
                if(dstTable && !schema.relations.some(rel =>
                    rel.from  === srcTableName  &&
                    rel.fromc === srcColumnName &&
                    rel.to    === dstTableName  &&
                    rel.toc   === dstColumnName
                )) {
                    schema.relations.push({
                        from        : srcTableName,
                        fromc       : srcColumnName,
                        to          : dstTableName,
                        toc         : dstColumnName,
                        category    : "FKC"
                    });
                }
            });
        }
    }

    /**
     * Sets the appropriate column's FKC flag. Returns true if the column was
     * found and flagged
     *
     * @param   {array}  table      the table containing the columns
     * @param   {string} columnName the columsn names
     * @returns {boolean}           true if the column was found
     */
    const setColumnFKC = (table, columnName) =>
        table.items.some(column => {
            if(column.key === columnName) {
                column.FKC = true;
                return true;
            }
        });
    /**
     * Returns an array of .java filenames within the given directory.
     *
     * @param   {string} dir given directory
     * @returns {array}      .java filenames
     */
    const getJavaFiles = (dir) => {

        let accumulator = [];

        for (let file of fs.readdirSync(dir)) {

            // if the file is a directory, then be recursive an go into the directory
            if(fs.lstatSync(dir + '/' + file).isDirectory()){
                accumulator = accumulator.concat(getJavaFiles(dir + '/' + file));

            // if the file is a java file, then add it to the list
            } else if(path.extname(file) === '.java') {
                accumulator.push(dir + '/' + file);
            }
        }
        return accumulator;
    };

})();

if(typeof __file__ === 'function') __file__('integrator');