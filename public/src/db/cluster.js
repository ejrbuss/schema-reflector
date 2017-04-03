/**
 * @authors ejrbuss, torreyr, colem
 *
 * Provides function for creating a summarized schema.
 */
(function() {

    const util = require('../util');
    const type = require('../type');

    /**
     * Takes a schema and returns an abstract version of that schema composed
     * of Abstract Entities and "Abstract Relation Entities". This process is
     * described in the paper "Clustering relations into abstract ER schemas
     * for database reverse engineering" found here:
     *
     * http://www.sciencedirect.com/science/article/pii/S0167642302000576
     *
     * This process only implements Phase 1 of the described algorithm.
     *
     * @param   {object} schema A schema to perform the algorithm on`
     * @returns {object}        The final Abstract schema
     */
    function cluster(schema) {

        let relations        = schemaToRelations(schema);
        let baseRelations    = disjointOrEqual(relations);
        let abstractEntities = [];
        let last;

        // Create abstract entities
        baseRelations.forEach(base =>
            last && util.dataEqual(base.items, last.keys)
                ? last.items.push(base)
                : abstractEntities.push(last = ({
                    key   : 'AE' + (abstractEntities.length + 1),
                    keys  : base.items,
                    items : [base]
                }))
        );

        // Sort out relations
        util.untilStable(unstable =>
            relations = relations.filter(candidate => {
                let matches = abstractEntities.filter(abstractEntity =>
                    util.intersects(candidate.items, abstractEntity.keys)
                );
                if(matches.length === 1) {
                    unstable();
                    matches[0].items.push(candidate);
                    matches[0].keys = util.unique(
                        candidate.items.concat(matches[0].keys)
                    );
                    return false;
                }
                return true;
            })
        );

        return abstractSchemaToSchema(
            abstractEntities,
            relateAbstractEntities(abstractEntities, relations)
        );
    }

    /**
     * Finds the set of base relations from a set of relations. This function
     * also removes those relations from the original set.
     *
     * @param  {Array} allRelations a set of relations
     * @return {Array}              the set of base relations
     */
    function disjointOrEqual(allRelations) {

        let relations = [];

        // should remove the disjoint or equal relations from relations
        for(let i = 0; i < allRelations.length; i++) {

            let r = allRelations[i];

            // if equals the next relation (equal relations will always be consecutive)
            let equal = false;
            if(i < allRelations.length - 1){
                if(util.dataEqual(r.items, allRelations[i+1].items)) {
                    relations.push(r);
                    allRelations.splice(i--, 1);
                    equal = true;
                }
            }
            if(!equal && relations.length != 0) {

                // if equals the one most recently added (adding last of equal relations)
                let equal = false;
                if(util.dataEqual(r.items, relations[relations.length - 1].items)) {
                    relations.push(r);
                    allRelations.splice(i--, 1);
                    equal = true;
                } else {

                    // check for disjoint
                    let disjoint = true;
                    for(let j = 0; j < relations.length; j++) {
                        if(util.intersects(r.items, relations[j].items)) {
                            disjoint = false;
                            break;
                        }
                    }
                    if(disjoint) {
                        relations.push(r);
                        allRelations.splice(i--, 1);
                    }
                }
            }
        }
        return relations;
    }

    /**
     * Inserts the remaining relations into Abstract Relations
     * relating Abstract Entities.
     *
     * @param   Array   abstractEntities    an array of all Abstract Entities
     * @param   Array   remainingRelations  a set of unclustered relations
     * @return  Array                       the set of Abstract Relations
     */
    function relateAbstractEntities(abstractEntities, remainingRelations) {

        let abstractRelations = [];

        remainingRelations.forEach(rel => {

            // Find the abstract entities this relation connects to.
            let connections = abstractEntities.filter(ae =>
                util.intersects(rel.items, ae.keys)
            );

            // Put all of the connected AE's keys in a single array.
            let connects = [];
            for (let i = 0; i < connections.length; i ++) {
                connects = connects.concat(connections[i].key);
            }

            // Find any pre-existing abstractRelations that it belongs in.
            let matches = abstractRelations.filter(ar => {
                return util.dataEqual(ar.joins, connects);
            });

            // Add the relation to a pre-existing or new abstractRelation.
            if (matches.length == 0) {
                abstractRelations.push({
                    key   : 'AR' + (abstractRelations.length + 1),
                    items : [rel],
                    joins : connects
                });
            } else {
                matches[0].items.push(rel);
            }

        });
        return abstractRelations;
    }

    /**
     * Sorts the relations at the end of schemaToRelations.
     *
     * @param   {mixed} a
     * @param   {mixed} b
     * @returns {int}     signifiying relative order
     */
    function sortAscPK(a, b) {

        let i = a.items.length;
        let j = b.items.length;

        if(i != j) {
            return i - j;
        }
        for(let k = 0; k < i; k++) {
            if(a.items[k] != b.items[k]) {
                return a.items[k].localeCompare(b.items[k]);
            }
        }
        return 0;
    }

    // for sorting the items in a relation below
    function sortRelationPK(a, b) {
        return a - b;
    }

    /**
     * Converts a schema to a set of relations. These relations are ordered
     * based off their primary and foreign keys, and their primary and foreign
     * keys are also sorted.
     *
     * @param   Object  schema  the schema to convert to a set of relations
     * @return  Array           the set of relations
     */
    function schemaToRelations(schema) {

        let tables = [];

        schema.tables.forEach(function(table) {
            let relation = {
                key     : table.key,
                items   : []
            };

            table.items.forEach(function(r) {
                if(r.PK)
                    relation.items.push(r.key);
            });

            relation.items.sort(sortRelationPK);
            tables.push(relation);
        });

        tables.sort(sortAscPK);

        return tables;
    }
    /**
     * Takes Abstract Entities and Abstract Relations and prenode pares their
     * dataEqual formatting for when they move to the diagram to be dispayed.
     * This requires turning relations into two relations relating a
     * "relation entity".
     *
     * @param   {Array}   abstractEntities    an array of all Abstract Entities
     * @param   {Array}   abstractRelations   an array of all Abstract Relations
     * @return  {Object}                      data in schema format
     */
    function abstractSchemaToSchema(abstractEntities, abstractRelations) {
        return {
            tables : Array.prototype.concat(
                abstractEntities.map(abstractEntity => ({
                    key      : abstractEntity.key,
                    id       : abstractEntity.key,
                    category : 'entity',
                    items    : abstractEntity.items.map(r => ({ key : r.key }))
                })),
                abstractRelations.map(abstractRelation => ({
                    key      : abstractRelation.key,
                    id       : abstractRelation.key,
                    category : 'relation',
                    items    : abstractRelation.items.map(r => ({ key : r.key }))
                }))
            ),
            relations : util.flatten(
                abstractRelations.map(abstractRelation =>
                    abstractRelation.joins.map(abstractEntity => ({
                        to   : abstractRelation.key,
                        from : abstractEntity
                    }))
                )
            )
        };
    }
    module.exports = cluster;

})();

if(typeof __file__ === 'function') __file__('cluster');