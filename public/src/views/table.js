(function () {

    const schema    = require('../db/schema');
    const util      = require('../util');
    const preloader = require('./preloader');

    module.exports = table =>
        `<h1 class="blue-text">${table.replace(/./, c => c.toUpperCase())}</h1>
        <div class="row">
            <div class="col s6">
                <a href="/tables" class="blue-text">❮ Return to Tables</a>
            </div>
            <div class="col s6 right-align">
                <a href="/concrete/${table}" class="blue-text">View Context ❯</a>
            </div>
        </div>
        <div class="grey-text text-darken-3">
            <div class="row white z-depth-3 padding">
                <table class="bordered" id="columns">
                    <thead>
                        <tr>
                            <th>Column</th>
                            <th>Data Type</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Primary Key">PK</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Foreign Key">FK</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Not Null">NN</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Unsigned">UN</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Zero Fill">ZF</th>
                            <th class="tooltipped" data-position="top" data-delay="50" data-tooltip="Auto Increment">AI</th>
                            <th>Default</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>${preloader()}</td></tr>
                    </tbody>
                </table>
            </div>
            <br>
            <br>
        </div>
        <script>
            $(document).ready(() => require('table').build('${table}'));
        </script>`;

    module.exports.build = util.client(table =>
        schema.columns().then(columns =>
            $('#columns tbody').html(columns.filter(col => col.table == table).reduce((html, col) =>
                `${html}<tr>
                    <td>${col.key}</td>
                    <td>${col.type}</td>
                    <td>${col.PK ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.FK ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.NN ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.UN ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.ZF ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.AI ? '<i class="material-icons">done</i>' : ''}</td>
                    <td>${col.DEFAULT ? col.DEFAULT : ''}</td>
                </tr>`,
            ''))));

})();

if(typeof __file__ === 'function') __file__('table');
