/**
 * @author Eric Buss
 * @date 2017
 *
 * Returns a record for every table.column to table.column relation in the OSCAR
 * database.
 */
SELECT DISTINCT
    t.TABLE_NAME AS `from`,
    c.COLUMN_NAME AS `fromc`,
    cu.REFERENCED_TABLE_NAME AS `to`,
    cu.REFERENCED_COLUMN_NAME AS `toc`
FROM INFORMATION_SCHEMA.COLUMNS AS c
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS cu
        ON c.COLUMN_NAME = cu.COLUMN_NAME
    LEFT JOIN INFORMATION_SCHEMA.TABLES AS t
        ON c.TABLE_NAME = t.TABLE_NAME
WHERE
    t.TABLE_SCHEMA = ? AND
    cu.REFERENCED_TABLE_NAME IS NOT NULL
GROUP BY
    t.TABLE_NAME, c.COLUMN_NAME;
