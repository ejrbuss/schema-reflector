/**
 * @author torreyr
 *
 * Provides functionality for expanding and focusing diagram view.
 */
(function() {

    const integrator = require('../parsers/integrator');
    const schema     = require('../db/schema');
    const diagram    = require('./build');
    const util       = require('../util');
    const type       = require('../type');
    const log        = require('../log');

    /**
     * Finds the tables and relations related to key.
     *
     * @param   {string} key    key to relate
     * @param   {object} schema schema object
     * @returns {object}        filtered schema
     */
    const filter = (key, schema) =>
        ({
            tables : diagram.mapTables(schema.tables).filter(table =>
                    table.key == key ||
                    schema.relations.find(relation =>
                        (relation.to == key && relation.from == table.key) ||
                        (relation.to == table.key && relation.from == key)
                    )
                ),

                // Get filtered relations
                relations : schema.relations.filter(relation =>
                    relation.to == key || relation.from == key
                )
        });

    /**
     * Shows a table and all of its connected nodes.
     *
     * @param   {string}    key     the table to focus on
     */
    const focus = util.client(key =>
        integrator().then(schema => {
        //schema.schema().then(schema => {

            // Type checking
            if(!type(key).string && type(key.toArray).function) {
                key = key.toArray()[0].fe.key;
            }
            type(key).assert.string;

            let filtered = filter(key, schema);

            diagram.mainDiagram().model = new go.GraphLinksModel(
                filtered.tables,
                filtered.relations
            );

            diagram.modifyDeleted(filtered);
        }));

    /**
     * If a table's relationships are not on the diagram at the moment, add
     * them.
     *
     * @param   {Set}      selected    the selected table(s) to expand
     */
    const expand = util.client(selected =>

        integrator().then(schema =>
        //schema.schema().then(schema =>
            selected.toArray().forEach(node => {

                diagram.mainDiagram().startTransaction('Expand');

                let filtered = filter(node.fe.key, schema);
                let nodes    = diagram.mainDiagram().nodes;
                let links    = diagram.mainDiagram().links;

                console.log(schema);
                diagram.modifyDeleted(filtered);

                filtered.tables.forEach(table => {
                    let inDiagram = false;

                    nodes.each(node => inDiagram = inDiagram || (node.data.key == table.key));

                    if(!inDiagram)
                        diagram.reAddNodeToDiagram(table);
                });

                filtered.relations.forEach(relation => {

                    let inDiagram = false;

                    links.each(link =>
                        inDiagram = inDiagram || (link.data.to == relation.to &&
                                                  link.data.from == relation.from)
                    );

                    if(!inDiagram)
                        diagram.reAddLinkToDiagram(relation);

                });

                diagram.mainDiagram().commitTransaction('Expand');
            }
        )));

        module.exports = { focus, expand };

})();

if(typeof __file__ === 'function') __file__('expander');