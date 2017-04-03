/**
 * @author Eric Buss
 * @date 2017
 *
 * Returns a record for every column in the OSCAR database.
 */
SELECT DISTINCT
    t.TABLE_NAME AS `table`,
    c.COLUMN_NAME AS `key`,
    c.COLUMN_DEFAULT AS `def`,
    c.EXTRA LIKE '%auto_increment%' AS `AI`,
    c.EXTRA LIKE '%zerofill%' AS `ZF`,
    c.EXTRA LIKE '%unsigned%' AS `UN`,
    IF(c.IS_NULLABLE = 'YES',
        0,
    # ELSE THEN
        1
    ) AS `NN`,
    IF(cu.CONSTRAINT_NAME = 'PRIMARY',
        1,
    # ELSE THEN
        0
    ) AS `PK`,
    IF(cu.REFERENCED_TABLE_NAME IS NOT NULL,
        1,
    # ELSE THEN
        0
    ) AS `FK`,
    cu.REFERENCED_TABLE_NAME  AS `reft`,
    cu.REFERENCED_COLUMN_NAME AS `refc`,
    c.COLUMN_TYPE AS `type`
FROM INFORMATION_SCHEMA.COLUMNS AS c
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS cu
        ON c.COLUMN_NAME = cu.COLUMN_NAME
    LEFT JOIN INFORMATION_SCHEMA.TABLES AS t
        ON c.TABLE_NAME = t.TABLE_NAME
WHERE
    t.TABLE_SCHEMA = ?
GROUP BY
    t.TABLE_NAME, c.COLUMN_NAME;
