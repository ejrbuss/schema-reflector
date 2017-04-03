(function() {

    const preloader = require('./preloader');

    module.exports = (context={}) =>
        `<div class="row no-margin no-padding">
            <div class="col s12">
                <div class="row no-margin">
                    <div class="col s1">
                        <div class="row">
                            <div class="col s12 animated slideInLeft">
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
                                <a
                                    id="removed-btn"
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-dealy="50"
                                    data-tooltip="Show Removed Entities"
                                    onclick="require('build').toggleRemoved()"
                                >
                                    <i class="blue-text fa fa-lg fa-trash"></i>
                                </a>
                                <br>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50"
                                    data-tooltip="Expand Selected"
                                    onclick="require('expander').expand(require('build').mainDiagram().selection)"
                                >
                                    <i class="blue-text fa fa-lg fa-expand"></i>
                                </a>
                                <br>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50" data-tooltip="Focus Selected"
                                    onclick="require('expander').focus(require('build').mainDiagram().selection)"
                                >
                                    <i class="blue-text fa fa-lg fa-compress"></i>
                                </a>
                                <br>
                                <a
                                    class="btn-floating btn-large white tooltipped"
                                    data-position="right"
                                    data-delay="50"
                                    data-tooltip="View Table Details"
                                    onclick="location.href='/table/' + require('build').mainDiagram().selection.toArray()[0].fe.key"
                                >
                                    <i class="blue-text fa fa-lg fa-list"></i>
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
                                    data-delay="50"
                                    data-tooltip="Show all Attributes"
                                    onclick="require('build').toggleColumns()"
                                >
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
                            <div id="removed-modal" class="white z-depth-2">
                                <div class="container center-align">
                                    <h5 class="blue-text">Deleted Nodes</h5>
                                    <p class="grey-text text-darken-2">Click a Node to restore it</p>
                                </div>
                                <ul id="deleted-tables"></ul>
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
                $('#removed-modal').hide();
                $('select').material_select();
                $("#column-toggle").on("change", require('diagram').toggleColumns);
                require('build').${context.build}(${context.table ? '"' + context.table + '"' : ''});
            });
        </script>`
})();

if(typeof __file__ === 'function') __file__('diagram');