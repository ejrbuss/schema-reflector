(function() {

    const preloader  = require('./preloader');
    const util       = require('../util');
    const connection = require('./connection');
    const user       = require('../user/user');
    const db         = require('../db/db-config');

    module.exports = (context={}) =>
        `<div class="row">
            <div class="col s12 center-align">
                <h2 class="blue-text">Manage Connections</h2>
                <div class="row">
                    <div class="col s6 push-s3">
                        <p class="grey-text text-darken-3 flow-text">
                            Select a connection to edit its configuration (hostname, port,
                            etc.) or connect to it. Click on add a new connection to connect
                            to add a new database.
                        </p>
                    </div>
                </div>
            </div>
            <div class="col s12">
                <ul id="connections" class="collapsible popout" data-collapsible="accordion">
                    ${preloader()}
                </ul>
                <div class="row">
                    <div class="col s12 center-align">
                        <a href="#add-connection" class="blue btn">Add a New Connection</a>
                    </div>
                </div>
            </div>
            <div id="add-connection" class="modal">
                <div class="modal-content container">
                    <div class="center-align">
                        <h4 class="blue-text">Add a New Connection</h4>
                    </div>
                    ${connection()}
                </div>
            </div>
        </div>
        <script>
            $(document).ready(require('connect').build);
        </script>
        `;

    // local build function
    const build = util.client(() => {
        $('.modal').modal();
        $('.collapsible').collapsible();
        refreshConnectionList();
    });

    /**
     * Refresh the connection list.
     */
    const refreshConnectionList = util.client(() => {
        require('base').updateStatus();
        db.test().then(err => user.getConnections()
            .then(connections => {
                $('#connections').html('');
                connections.forEach(con => {

                    let color = con.selected
                        ? (err ? 'red' : 'green')
                        : ''

                    $('#connections').append(
                        `<li class="white">
                            <div class="collapsible-header ${con.selected ? 'white-text' : 'blue-text'} ${color}">
                                <b>${con.name}</b>
                                <span class="grey-text text-lighten-2 italics">${con.host}</span>
                                <span class="push-right">
                                    <a
                                        class="tooltipped"
                                        data-position="top"
                                        data-dealy="50"
                                        data-tooltip="Remove Connection"
                                        onclick="require('connect').removeConnection('${con.dir}')"
                                    >
                                        <i class="fa fa-times ${con.selected ? 'white-text' : 'blue-text'}" aria-hidden="true"></i>
                                    </a>
                                </span>
                            </div>
                            <div class="collapsible-body container"><br>${connection(con, 'require("connect").setConnection')}</div>
                        </li>`
                    );
                    Materialize.updateTextFields();
                });
            }));
    });
    /**
     * Remove a connection from the connection list.
     */
    const removeConnection = util.client((dir) => {
        $('#connections').html('');
        user.removeConnection(dir).then(refreshConnectionList);
        Materialize.toast('Connection "' + dir + '" removed', 4000, 'green white-text');
    });
    /**
     * Clear the cache.
     */
    const clearState = util.client((dir) => {
        user.clearCache(dir);
        connect(dir);
        refreshConnectionList();
        Materialize.toast('Cache for "' + dir + '" cleared', 4000, 'green white-text');
    });
    /**
     * Connect to a connection configuration.
     */
    const connect = util.client((dir) => {
        // Setting
        if(dir) {
            user.setConnection({
                dir      : dir,
                name     : $(`#${dir}-name`).val(),
                host     : $(`#${dir}-host`).val(),
                port     : $(`#${dir}-port`).val(),
                user     : $(`#${dir}-user`).val(),
                password : $(`#${dir}-password`).val(),
                database : $(`#${dir}-database`).val(),
                source   : $(`#${dir}-source`).val()
            });
            refreshConnectionList();

        // Adding
        } else if(!$(`#-name`).val()) {
            Materialize.toast('You must provide a connection name', 4000, 'red white-text');
        } else {
            user.addConnection({
                dir      : $(`#-name`).val(),
                name     : $(`#-name`).val(),
                host     : $(`#-host`).val(),
                port     : $(`#-port`).val(),
                user     : $(`#-user`).val(),
                password : $(`#-password`).val(),
                database : $(`#-database`).val(),
                source   : $(`#${dir}-source`).val()
            });
            $('#add-connection').modal('close');
            refreshConnectionList();
        }
    });

    module.exports = util.extend(module.exports, {
        build,
        refreshConnectionList,
        removeConnection,
        clearState,
        connect
    });

})();

if(typeof __file__ === 'function') __file__('connect');