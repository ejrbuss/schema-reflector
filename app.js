/**
 * @authros ejrbuss torrey colem jonb
 *
 * This is the central application fiel for the OSCAR EMR Visualizer web
 * application. The rest of the source can be found in ./public/src. This file
 * contains the bulk of the express server routing as well as the site API.
 */
console.log(
`  _____ _____ _____ _____ _____ _____
|   __|     |  |  |   __|     |  _  |
|__   |   --|     |   __| | | |     |
|_____|_____|__|__|_____|_|_|_|__|__|
                           VISUALIZER

By Comif Relief

Source available at:
    http://jira.seng.uvic.ca:8051/projects/CR/repos/milestone3/browse

SCHEMA Visualizer is an analysis tool for the software package OSCAR EMR.
It is being developed as part of the University of Victorias Software
Engineering 371 course on software evolution.`
);

// Load Express and utilies
const express  = require('express');
const program  = require('commander');
const parser   = require('body-parser');
const util     = require('./public/src/util');
const log      = require('./public/src/log');

// Parse command lines
const app      = express();
app.use(express.static('public'));
app.use(parser.json());
util.__app__   = app;

program
  .version('0.0.2')
  .option('-p, --port <n>', 'Set host port', parseInt)
  .option('-d, --debug',    'Start in debug mode')
  .parse(process.argv);

// Set optional port
util.__port__ =  program.port || process.env.npm_package_config_port || 8080;
// Set logging level
program.debug
    ? log(log.levels.DEBUG)
    : log(log.levels.WARN);

// DB
const schema     = require('./public/src/db/schema');
const db         = require('./public/src/db/db-config');
const user       = require('./public/src/user/user');
const integrator = require('./public/src/parsers/integrator')

// Views
const base     = require('./public/src/views/base');
const home     = require('./public/src/views/home');
const connect  = require('./public/src/views/connect');
const tables   = require('./public/src/views/tables');
const table    = require('./public/src/views/table');
const error    = require('./public/src/views/error');
const abstract = require('./public/src/views/abstract');
const concrete = require('./public/src/views/concrete');

/**
 * Redirects base URL to the home page.
 */
app.get('/', (req, res) => res.redirect('/home'));
/**
 * Loads the home page.
 */
app.get('/home', (req, res) =>
    res.send(base({
        active  : 'home',
        class   : 'container',
        content : home(),
    })));
/**
 * Loads the connection page.
 */
app.get('/connect', (req, res) => {
    res.send(base({
        active  : 'connect',
        class   : 'container',
        content : connect()
    }))
});
/**
 * Loads the table index page.
 */
app.get('/tables', (req, res) =>
    res.send(base({
        active  : 'tables',
        class   : 'container',
        content : tables()
    })));
/**
 * Loads a detailed description of the provided table name.
 */
app.get('/table/:table', (req, res) =>
    res.send(base({
        active  : 'tables',
        class   : 'container',
        content : table(req.params.table)
    })));
/**
 * Loads the base visualizer page.
 */
app.get('/concrete', (req, res) =>
    res.send(base({
        active : 'concrete',
        content : concrete({
            build : 'buildNormal'
        })
    })));
/**
 * Loads the visualizer page for the provided table name.
 */
app.get('/concrete/:table', (req, res) =>
    res.send(base({
        active : 'concrete',
        content : concrete({
            build : 'buildNormal',
            table : req.params.table
        })
    })));
/**
 * Loads the abstract view page.
 */
app.get('/abstract', (req, res) => {
    res.send(base({
        active : 'abstract',
        content : abstract({
            build : 'buildAbstract'
        })
    }))});
/**
 * Loads the abstract view page for the provided table name.
 */
app.get('/abstract/:aer', (req, res) => {
    res.send(base({
        active : 'abstract',
        content : abstract({
            build : 'buildAbstract',
            table : req.params.aer
        })
    }))
});
/**
 * 404 Middleware solution
 */
app.use((req, res) =>
    res.status(404).send(base({
        active : '404',
        content : error({
            error : '404 Error',
            message :
`We have no idea where you think you're going, but now you're in the middle of
nowhere. Good luck getting home and watch out for monsters!`
        })
    })));

app.listen(util.__port__, () => console.log('Server started on ' + util.__port__));