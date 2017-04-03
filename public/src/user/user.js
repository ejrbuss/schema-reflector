/**
 * @author ejrbuss
 *
 * Provides functionality for creating seperate database connections with their
 * own state tracked with them.
 */
(function() {

    const fs   = require('fs');
    const db   = require('../db/db-config');
    const util = require('../util');
    const type = require('../type');
    const log  = require('../log');

    let config;

    /**
     * Checks that all the necessary connection files and directories exsist.
     * Creates them if necessary.
     *
     * @param {string} dir the name of the connection directory
     */
    const checkFiles = (dir) => {
        if(!fs.existsSync('./connections')) {
            log.warn('/connections/ not found, creating directory');
            fs.mkdirSync('./connections');
        }
        if(dir) {
            if(!fs.existsSync(`./connections/${dir}/`)) {
                log.warn(`/connections/${dir}/ not found, creating directory`);
                fs.mkdirSync(`./connections/${dir}/`);
            }
            if(!fs.existsSync(`./connections/${dir}/config.json`)) {
                log.warn(`/connections/${dir}/config.json not found, creating config file`);
                fs.writeFileSync(`./connections/${dir}/config.json`, `{
                    "dir": "${dir}",
                    "name": "${dir}"
                }`);
            }
            if(!fs.existsSync(`./connections/${dir}/state.json`)) {
                log.warn(`/connections/${dir}/state.json not found, creating state file`);
                fs.writeFileSync(`./connections/${dir}/state.json`, 'false');
            }
        }
    };

    // Set starting connection to default
    if(util.__node__) {
        checkFiles('default');
        config = JSON.parse(fs.readFileSync('./connections/default/config.json'));
        db.set(config);
    }

    /**
     * Get an array of all configured connections.
     *
     * Defines GET /api/connection/get
     */
    const getConnections = util.app.get('/api/connection/get', (args, resolve) => {
        checkFiles();
        resolve(fs.readdirSync('./connections').reduce((connections, name) => {
            let connection = JSON.parse(fs.readFileSync(`./connections/${name}/config.json`, 'utf8'));
            connection.selected = name === config.dir;
            connections.push(connection);
            return connections;
        }, []))
    });

    /**
     * Set the current configuration and reload the database.
     *
     * Defines POST /api/connection/set
     *
     * @param {object} config the new database configuration
     */
    const setConnection = util.app.post('/api/connection/set', (args, resolve) => {
        checkFiles(args.dir);
        fs.writeFileSync(`./connections/${args.dir}/config.json`, JSON.stringify(args, null, 4));
        config = args;
        db.set(config);
        resolve();
    });

    /**
     * Add a connection to the connection list. Also sets the current
     * configuration to the new connection and reloads the database.
     *
     * Defines POST /api/connection/add
     *
     * @param {object} config the new database configuration
     */
    const addConnection = util.app.post('/api/connection/add', (args, resolve) => {
        checkFiles(args.dir);
        // Creat directory
        fs.writeFileSync(`./connections/${args.dir}/config.json`, JSON.stringify(args, null, 4));
        fs.writeFileSync(`./connections/${args.dir}/state.json`, 'false');
        config = args;
        db.set(config);
        resolve();
    });

    /**
     * Removes a connection.
     *
     * Defines POST /api/connection/remove
     *
     * @param {string} dir the directory name of the connection to remove
     */
    const removeConnection = util.app.post('/api/connection/remove', (args, resolve) => {
        checkFiles(args);
        // Delete files
        fs.unlinkSync(`./connections/${args}/config.json`);
        fs.unlinkSync(`./connections/${args}/state.json`);
        fs.rmdirSync(`./connections/${args}/`);
        resolve();
    });

    /**
     * Retrieves the state of the currnetly configured connection.
     *
     * Defines GET /api/state/get
     */
    const getState = util.app.get('/api/state/get', (args, resolve) => {
        checkFiles(config.dir);
        resolve(JSON.parse(fs.readFileSync(`./connections/${config.dir}/state.json`, 'utf8')));
    });

    /**
     * Extends the current state. Any prexisting state will be ignored unless
     * explicityly overwritten.
     *
     * Defiens POST /api/state/set
     *
     * @param {object} state new state object
     */
    const setState = util.app.post('/api/state/set', (args, resolve) => {
        type(args).assert.object;
        let state = JSON.parse(fs.readFileSync(`./connections/${config.dir}/state.json`, 'utf8')) || {};
        checkFiles(config.dir);
        fs.writeFileSync(`./connections/${config.dir}/state.json`, JSON.stringify(util.extend(state, args)));
        resolve();
    });

    /**
     * Clears the database cache. Database is only queried the first time, from
     * then on the query results are cached in state. This clears the cache
     * allowing changes in the database to be reflected.
     *
     * Defines POST /api/state/clear
     *
     * @param {string} dir the directory name of the connection to remove
     */
    const clearCache = util.app.post('/api/state/clear', (args, resolve) => {
        fs.unlinkSync(`./connections/${args}/state.json`);
        checkFiles(args);
    });

    /**
     * Caching function. When passed a key and a value sets that part of the
     * cache. When passed only a key returns the value at that cache if any.
     *
     * @param   {string} key   Cache key
     * @param   {mixed}  value Value to cache
     * @returns {mixed}        Cached out value
     */
    const cache = util.server((key, value) => {
        checkFiles(config.dir);
        let state = JSON.parse(fs.readFileSync(`./connections/${config.dir}/state.json`, 'utf8')) || {};
        if(value) {
            let cache = { cache : { [key] : value } };
            fs.writeFileSync(`./connections/${config.dir}/state.json`, JSON.stringify(util.extend(state, cache)));
            return value;
        }
        return state.cache && state.cache[key];
    });

    module.exports = {
        getConnections,
        setConnection,
        addConnection,
        removeConnection,
        getState,
        setState,
        cache,
        clearCache,
        config : util.server(() => config)
    };

})();

if(typeof __file__ === 'function') __file__('user');