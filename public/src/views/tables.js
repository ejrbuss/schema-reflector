(function() {

    const schema    = require('../db/schema');
    const util      = require('../util');
    const preloader = require('./preloader');

    module.exports = () =>
        `<div class="row">
            <div class="col s12 center-align">
                <h2 class="blue-text">Tables</h2>
                <div class="row">
                    <div class="col s6 push-s3">
                        <p class="grey-text text-darken-3 flow-text">
                            Select a table from the list below to see details about its
                            schema.
                    </div>
                </div>
            </div>
            <div class="col s12">
                <ul class="news-col" id="tables">
                    ${preloader()}
                </ul>
            </div>
        </div>
        <script>
            $(document).ready(() => require('tables').build());
        </script>`;

    module.exports.build = util.client(() =>
        schema.tables().then(tables => {
            let previous;
            $('#tables').html(tables.reduce((html, table) => {
                if(previous != table[0]) {
                    previous = table[0];
                    html = `${html}<li><h1 class="blue-text">${previous.toUpperCase()}</h1></li>`;
                }
                return `${html}<li><a class="grey-text text-darken-3" href="/table/${table}">${table}</a></li>`;
            }, ''));
        }));

})();

if(typeof __file__ === 'function') __file__('tables');
