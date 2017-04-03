(function() {

    const util = require('../util');
    const db   = require('../db/db-config');

    module.exports = (context={}) =>
        `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">

                <title>${context.active.replace(/./, c => c.toUpperCase())}</title>

                <!-- Set favicon -->
                <link rel="icon" href="/images/logo.png">

                <!-- Import Google Icon Font-->
                <link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

                <!-- Import styles-->
                <link type="text/css" rel="stylesheet" href="/materialize/css/materialize.min.css"  media="screen,projection"/>
                <link type="text/css" rel="stylesheet" href="/css/font-awesome.min.css">
                <link type="text/css" rel="stylesheet" href="/css/animate.css"/>
                <link type="text/css" rel="stylesheet" href="/css/styles.css"/>

                <!-- Let browser know website is optimized for mobile-->
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body class="animated fadeIn grey lighten-3">

                <!-- Import jQuery before materialize.js-->
                <script type="text/javascript" src="/lib/jquery-3.1.1.min.js"></script>
                <script type="text/javascript" src="/materialize/js/materialize.min.js"></script>

                <!-- Import Visualizer Scripts-->
                <script type="text/javascript" src="/lib/go-debug.js"></script>
                <script type="text/javascript" src="/lib/exports.js"></script>
                <script type="text/javascript" src="/src/type.js"></script>
                <script type="text/javascript" src="/src/util.js"></script>
                <script type="text/javascript" src="/src/log.js"></script>
                <script type="text/javascript" src="/src/db/db-config.js"></script>
                <script type="text/javascript" src="/src/db/schema.js"></script>
                <script type="text/javascript" src="/src/db/cluster.js"></script>
                <script type="text/javascript" src="/src/user/user.js"></script>
                <script type="text/javascript" src="/src/views/base.js"></script>
                <script type="text/javascript" src="/src/views/connection.js"></script>
                <script type="text/javascript" src="/src/views/connect.js"></script>
                <script type="text/javascript" src="/src/views/tables.js"></script>
                <script type="text/javascript" src="/src/views/table.js"></script>
                <script type="text/javascript" src="/src/views/home.js"></script>
                <script type="text/javascript" src="/src/views/abstract.js"></script>
                <script type="text/javascript" src="/src/views/concrete.js"></script>
                <script type="text/javascript" src="/src/diagram/theme.js"></script>
                <script type="text/javascript" src="/src/parsers/integrator.js"></script>
                <script type="text/javascript" src="/src/diagram/figure.js"></script>
                <script type="text/javascript" src="/src/diagram/build.js"></script>
                <script type="text/javascript" src="/src/diagram/expander.js"></script>
                <script type="text/javascript" src="/src/parsers/parse-util.js"></script>
                <script type="text/javascript" src="/src/parsers/java/java-lexer.js"></script>
                <script type="text/javascript" src="/src/parsers/java/java-parser.js"></script>
                <script>
                    require('base').updateStatus();
                </script>
                <div>
                    <!-- Nav Bar-->
                    <nav class="row animated slideInDown white no-margin">
                        <div class="col s3 blue-text">
                            <img src="/images/title.png">
                        </div>
                        <div class="col s9">
                            <ul class="tabs push-right">
                                <li class="tab blue-text">
                                    <a class="blue-text ${context.active === 'concrete' ? 'active' : ''}" onclick="require('util').redirect('/concrete')">Concrete View</a>
                                </li>
                                <li class="tab">
                                    <a class="blue-text ${context.active === 'abstract' ? 'active' : ''}" onclick="require('util').redirect('/abstract')">Abstract View</a>
                                </li>
                                <li class="tab">
                                    <a class="blue-text ${context.active === 'tables' ? 'active' : ''}" onclick="require('util').redirect('/tables')">Tables</a>
                                </li>
                                <li class="tab">
                                    <a class="blue-text ${context.active === 'connect' ? 'active' : ''}" onclick="require('util').redirect('/connect')">Connect</a>
                                </li>
                                <li class="tab">
                                    <a class="blue-text ${context.active === 'home' ? 'active' : ''}" onclick="require('util').redirect('/home')">Home</a>
                                </li>
                                <li id="connection-status"></li>
                            </ul>
                        </div>
                    </nav>

                    <!-- Content -->
                    <div class="${context.class}" id="content">
                        ${context.content}
                    </div>

                    <!-- Footer -->
                    <footer class="page-footer white animated slideInUp no-margin">
                        <div class="container">
                            <div class="row">
                                <div class="col s12">
                                    <h5 class="blue-text">Follow the Development</h5>
                                    <p class="grey-text grey-text text-darken-3">
                                        The repository for this project can be found on
                                        Github right <a class="blue-text" href="https://github.com/ejrbuss/schema-reflector" target="_blank">here</a>.
                                        Let us know what you think of the project.
                                        <br>
                                        <br>
                                        Schema Reflector by Comic Relief was
                                        developed for the purpose of the University
                                        of Victoria's Software Engineering 371 course on
                                        software evolution in order to analyze OSCAR EMR.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="footer-copyright grey-text text-darken-4">
                            <div class="container">
                                © 2017 Comic Relief
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>`;

    const base = {
        updateStatus : util.client(() => {
            db.test().then(err =>
                err
                    ? $('#connection-status').html(
                        `<div
                            class="tooltipped pointer"
                            data-position="bottom"
                            data-delay="50"
                            data-tooltip="You are not connected, using backup data"
                        >
                            <i class="red-text large material-icons">error</i>
                        </div>`
                    )
                    : $('#connection-status').html(
                        `<div
                            class="tooltipped pointer"
                            data-position="bottom"
                            data-delay="50"
                            data-tooltip="You are connected"
                        >
                            <i class="blue-text large material-icons">start</i>
                        </div>`
                    )
            );
            $('.tooltipped').tooltip({delay: 50});
        }),
    };

    module.exports = util.extend(module.exports, base);

})();

if(typeof __file__ === 'function') __file__('base');
