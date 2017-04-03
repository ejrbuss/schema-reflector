(function() {

    const preloader = require('./preloader');

    module.exports = (context={}) =>
        `<div class="row no-margin no-padding">
            <div class="col s12">
                <div class="row no-margin">
                    <div class="col s1">
                        <div class="row">
                            <div class="col s12">
                                <a
                                    id="layouts-btn"
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50"
                                    data-tooltip="Change Layout"
                                    onclick="require('build').toggleLayouts()"
                                >
                                    <i class="blue-text fa fa-lg fa-share-alt"></i>
                                </a>
                                <br>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50"
                                    data-tooltip="Export Image"
                                    onclick="require('figure').makeImage()"
                                >
                                    <i class="blue-text fa fa-lg fa-file-image-o"></i>
                                </a>
                                <br>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50" data-tooltip="${
                                        context.table
                                            ? 'Drill Up'
                                            : 'Drill Down Selected'
                                    }"
                                    onclick="${
                                        context.table
                                            ? `location.href='/abstract'`
                                            : `location.href='/abstract/' + require('build').mainDiagram().selection.toArray()[0].fe.id`
                                    }">
                                    <i class="blue-text fa fa-lg fa-sitemap ${
                                        context.table
                                            ? 'upside-down'
                                            : ''
                                    }"></i>
                                </a>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50"
                                    data-tooltip="Toggle all Attributes"
                                    onclick="require('build').toggleColumns()">
                                    <i id="column-toggle" class="blue-text fa fa-lg fa-eye"></i>
                                </a>
                            </div>
                            <div id="layouts-modal" class="white z-depth-2">
                                <div class="input-field col s12">
                                    <select class="blue-text" id="layouts">
                                        <option value=0>Force Directed Layout</option>
                                        <option value=1>Circular Layout</option>
                                        <option value=2>Layered Digraph Layout</option>
                                        <option value=3>Grid Layout</option>
                                    </select>
                                </div>
                                <a class="col s12 blue btn white-text" onclick="require('build').changeLayout()">Set Layout</a>
                            </div>
                        </div>
                    </div>
                    <div class="col s11">
                        <div id="diagram" class="diagram-height">
                            ${preloader()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            $(document).ready(() => {
                $('#layouts-modal').hide();
                $('select').material_select();
                $("#column-toggle").on("change", require('diagram').toggleColumns);
                require('build').${context.build}(${context.table ? '"' + context.table + '"' : ''});
            });
        </script>`
})();

if(typeof __file__ === 'function') __file__('abstract');