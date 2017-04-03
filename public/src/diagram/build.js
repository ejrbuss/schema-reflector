(function() {

    const integrator = require('../parsers/integrator');
    const schema     = require('../db/schema');
    const util       = require('../util');
    const log        = require('../log');
    const cluster    = require('../db/cluster');
    const theme      = require('./theme');

    let mainDiagram;
    let deletedNodes  = [];
    let deletedLinks  = [];
    let dState        = null;
    let hash          = null;
    let currentLayout = 0;

    /**
     * Reformats a set of table objects.
     *
     * @param   {object}    tables    schema tables object
     * @returns {object}
     */
    let mapTables = util.client(tables =>

        // Map Tables
        tables.map(table => ({
            key      : table.key,
            id       : table.id,
            category : table.category,

            // Map items
            items : table.items.map(item => ({
                name  : item.key,
                font  : item.PK || item.FK || item.FKC
                    ? 'bold 14px "Roboto"'
                    : 'normal 14px "Roboto"',
                color : item.PK
                    ? theme.PK
                    : item.FK
                        ? theme.FK
                        : item.FKC
                            ? theme.FKC
                            : theme.foreground
            }))
        }))
    );
    module.exports.mapTables = mapTables;

    /**
     * Builds a GoJS diagram from the given schema. If it is passed
     * a table name, it focuses the diagram around that table.
     *
     * @param   {object}    schema        schema data object
     * @param   {string}    table        table name
     * @param   {boolean}    editable    whether the entity names should
     *                                     be editable
     */
    let build = util.client((schema, table, editable=false) => {

        let $ = go.GraphObject.make;

        mainDiagram = $(go.Diagram, 'diagram', {
            initialContentAlignment      : go.Spot.Center,
            hasVerticalScrollbar         : false,
            hasHorizontalScrollbar       : false,
            allowDelete                  : true,
            allowCopy                    : false,
            layout                       : $(go.ForceDirectedLayout),
            initialAutoScale             : go.Diagram.Uniform,
            'undoManager.isEnabled'      : true,
            'animationManager.isEnabled' : true
        });

        // Column template
        itemTemplate = $(
            go.Panel,
            'Horizontal',
            $(
                go.TextBlock,
                { margin : 4 },
                new go.Binding('font', 'font'),
                new go.Binding('stroke', 'color'),
                new go.Binding('text', 'name')
            )
        );

        let entityTemplate = $(
            go.Node,
            'Auto',
            {
                selectionAdorned : true,
                resizable        : false,
                layoutConditions : go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
                fromSpot         : go.Spot.AllSides,
                toSpot           : go.Spot.AllSides,
                isShadowed       : theme.shadowed,
            },
            new go.Binding('location', 'location').makeTwoWay(),
            $(
                go.Shape,
                'Rectangle',
                { fill : theme.background, stroke : theme.border, strokeWidth : 2,
                  fromLinkableDuplicates: false, toLinkableDuplicates: false}
            ),
            $(
                go.Panel,
                'Table',
                { margin : 8, stretch : go.GraphObject.Fill },
                $(
                    go.RowColumnDefinition,
                    { row : 0, sizing : go.RowColumnDefinition.None }
                ),
                $(
                    go.TextBlock,
                    {
                        row      : 0, alignment: go.Spot.Center,
                        margin   : new go.Margin(0, 14, 0, 2),
                        font     : 'normal 18px "Roboto"',
                        stroke   : theme.foreground,
                        editable : editable
                    },
                    new go.Binding('text', 'key')
                ),
                $(
                    'PanelExpanderButton',
                    'COLS',
                    { row: 0, alignment: go.Spot.TopRight }
                ),
                $(
                    go.Panel,
                    'Vertical',
                    {
                        name            : 'COLS',
                        row             : 1,
                        padding         : 3,
                        alignment       : go.Spot.TopLeft,
                        defaultAlignment: go.Spot.Left,
                        stretch         : go.GraphObject.Horizontal,
                        itemTemplate    : itemTemplate,
                        visible         : false,
                    },
                    new go.Binding('itemArray', 'items')
                )
            )
        );

        let abstractRelationTemplate = $(
            go.Node,
            'Auto',
            {
                selectionAdorned : true,
                resizable        : false,
                layoutConditions : go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
                fromSpot         : go.Spot.AllSides,
                toSpot           : go.Spot.AllSides,
                isShadowed       : theme.shadowed,
            },
            new go.Binding('location', 'location').makeTwoWay(),
            $(
                go.Shape,
                'Diamond',
                { fill : theme.background, stroke : theme.border, strokeWidth : 2 }
            ),
            $(
                go.Panel,
                'Table',
                { margin : 8, stretch : go.GraphObject.Fill },
                $(
                    go.RowColumnDefinition,
                    { row : 0, sizing : go.RowColumnDefinition.None }
                ),
                $(
                    go.TextBlock,
                    {
                        row      : 0, alignment: go.Spot.Center,
                        margin   : new go.Margin(0, 14, 0, 2),
                        font     : 'normal 18px "Roboto"',
                        stroke   : theme.foreground,
                        editable : true
                    },
                    new go.Binding('text', 'key')
                ),
                $(
                    'PanelExpanderButton',
                    'COLS',
                    { row: 0, alignment: go.Spot.TopRight }
                ),
                $(
                    go.Panel,
                    'Vertical',
                    {
                        name            : 'COLS',
                        row             : 1,
                        padding         : 3,
                        alignment       : go.Spot.TopLeft,
                        defaultAlignment: go.Spot.Left,
                        stretch         : go.GraphObject.Horizontal,
                        itemTemplate    : itemTemplate,
                        visible         : false,
                    },
                    new go.Binding('itemArray', 'items')
                )
            )
        );

        // Entity template
        //mainDiagram.nodeTemplate = abstractRelationTemplate;

        //http://gojs.net/latest/intro/templateMaps.html
        let templMap = new go.Map("string", go.Node);

        templMap.add("entity", entityTemplate);
        templMap.add("relation", abstractRelationTemplate);
        templMap.add("", entityTemplate);

        mainDiagram.nodeTemplateMap = templMap;

        //defualt relation template
        let defaultLink = $(
            go.Link,  // the whole link panel
            {
                selectionAdorned : true,
                layerName        : 'Foreground',
                reshapable       : true,
                routing          : go.Link.AvoidsNodes,
                corner           : 5,
                curve            : go.Link.JumpOver,
            },
            $(
                go.Shape,
                { stroke : theme.link, strokeWidth : 2.5 }
            ),
            $(
                go.TextBlock,
                {
                    segmentIndex       : 0,
                    segmentOffset      : new go.Point(NaN, NaN),
                    segmentOrientation : go.Link.OrientUpright
                },
                new go.Binding('text', 'text')
            ),
            $(
                go.TextBlock,
                {
                    segmentIndex       : -1,
                    segmentOffset      : new go.Point(NaN, NaN),
                    segmentOrientation : go.Link.OrientUpright
                },
                new go.Binding('text', 'toText')
            )
        );

        let fkcLink = $(
            go.Link,  // the whole link panel
            {
                selectionAdorned : true,
                layerName        : 'Foreground',
                reshapable       : true,
                routing          : go.Link.AvoidsNodes,
                corner           : 5,
                curve            : go.Link.JumpOver
            },
            $(
                go.Shape,
                { stroke : theme.FKC, strokeWidth : 2.5 }
            ),
            $(
                go.TextBlock,
                {
                    segmentIndex       : 0,
                    segmentOffset      : new go.Point(NaN, NaN),
                    segmentOrientation : go.Link.OrientUpright
                },
                new go.Binding('text', 'text')
            ),
            $(
                go.TextBlock,
                {
                    segmentIndex       : -1,
                    segmentOffset      : new go.Point(NaN, NaN),
                    segmentOrientation : go.Link.OrientUpright
                },
                new go.Binding('text', 'toText')
            )
        );

        let linkTemplMap = new go.Map("string", go.Link);
        linkTemplMap.add("default", defaultLink);
        linkTemplMap.add("", defaultLink);
        linkTemplMap.add("FKC", fkcLink);

        // Relation Template
        mainDiagram.linkTemplateMap = linkTemplMap;

        // code taken from:
        // http://gojs.net/latest/intro/changedEvents.html
        mainDiagram.addModelChangedListener(function(event) {

            if(!event.isTransactionFinished)
                return; //ignore unimportant transactions

            let txn = event.object;

            if(txn == null) return;

            txn.changes.each(function(e) {

                if (e.change === go.ChangedEvent.Remove) {
                    if(e.modelChange == "nodeDataArray") {
                        deletedNodes.push(e.oldValue);
                        addDeletedNodeToList(e.oldValue.key);
                    } else {
                        deletedLinks.push(e.oldValue);
                    }
                } else if (
                    e.change === go.ChangedEvent.Property &&
                    e.propertyName === "text"              &&
                    e.oldValue
                ) {
                    //changed name
                    let oldKey = e.oldValue;
                    let newKey = e.newValue;
                    log.info(oldKey + " changed to " + newKey);
                    let node;
                    let nodes = mainDiagram.nodes;
                    while(nodes.next()) {
                        if(nodes.value.fe.key == oldKey) {
                            node = nodes.value.fe;
                        }
                    }
                    if(node) {
                        node.key = newKey;

                        let it = mainDiagram.links;
                        while(it.next()) {
                            let link = it.value.fe;
                            if(link.to === oldKey)
                                link.to = newKey;
                            if(link.from === oldKey)
                                link.from = newKey;
                        }
                    }

                    saveDiagramState();
                }
            });
        });

        //hash = hash(schema);
        hash = util.hash(schema);

        if(table) {
            require('expander').focus(table);
        } else {
            mainDiagram.model = new go.GraphLinksModel(
                mapTables(schema.tables),
                JSON.parse(JSON.stringify(schema.relations))
            );
        }
        loadDiagramFromState();
    });

    /**
     * Builds the abstract version of the diagram.
     *
     * @param   {string}    aerName     abstract object name
     */
    module.exports.buildAbstract = util.client(aerName => {
        if(aerName) {
            schema.schema().then(data => {
                let aers = cluster(data);
                let aer  = aers.tables.find(table => table.key === aerName);
                if(aer) {
                    data.tables = data.tables.filter(table =>
                        aer.items.find(item =>
                            item.key === table.key
                        )
                    );
                    data.relations = data.relations.filter(relation =>
                        aer.items.find(item =>
                            item.key === relation.to
                        ) &&
                        aer.items.find(item =>
                            item.key === relation.from
                        )
                    )
                    build(data);
                }
            });
        } else {
            schema.schema().then(data =>
                build(cluster(data), void(0), true)
            );
        }
    });

    /**
     * Builds the concrete version of the diagram.
     *
     * @param   {string}    table    table name
     */
    module.exports.buildNormal = util.client(table =>
        integrator().then(data => build(data, table))
    );

    /**
     * Saves the current state of the diagram.
     */
    function saveDiagramState() {

        let diagramState = mainDiagram.model.toJSON();

        dState = diagramState;

        let state = {
            [hash]: {
                layout : currentLayout,
                state  : diagramState
            }
        };

        require('user').setState(state);
    }

    /**
     * Saves the current state of the diagram.
     */
    module.exports.saveDiagramState = util.client(() => {
        saveDiagramState();
    });

    /**
     * Displays the diagram that was last saved state.
     */
    function loadDiagramFromState() {
        require('user').getState().then((state) => {
            //load state

            log.debug(state);
            let dState = state[hash];

            if(dState) {
                mainDiagram.model = go.Model.fromJSON(dState.state);
                setLayout(dState.layout);
            } else {
                log.warn('Nothing to load');
            }
        });
    }
    module.exports.loadDiagramFromState = loadDiagramFromState;

    /**
     * Adds previously-deleted nodes back onto the diagram.
     */
    module.exports.addDeletedNodes = util.client(() => {
        mainDiagram.startTransaction("Add All Deleted Nodes");

        // Add Tables
        deletedNodes.forEach(reAddNodeToDiagram);
        deletedNodes = [];

        // Add Relations
        deletedLinks.forEach(reAddLinkToDiagram);
        deletedLinks = [];

        mainDiagram.commitTransaction("Add All Deleted Nodes");
    });

    /**
     * Adds previously-deleted nodes back onto the diagram.
     *
     * @param     {object}    schema    schema data object
     */
    module.exports.modifyDeleted = util.client(schema => {

        deletedNodes = deletedNodes.filter(node => {
            if(schema.tables.find(table => table.key == node.key)) {
                $('#' + node.key).remove();
                return false;
            }
            return true;
        });

        deletedLinks = deletedLinks.filter(link =>
            schema.relations.find(relation =>
                relation.to == link.to && relation.from == link.key
            )
        );
    });

    /**
     * Changes the diagram layout.
     */
    module.exports.changeLayout = util.client(() => {

        toggleLayouts();
        mainDiagram.startTransaction("Change Layout");

        switch(document.getElementById("layouts").value) {
            case "0":
                mainDiagram.layout = go.GraphObject.make(go.ForceDirectedLayout);
                currentLayout = "0";
                break;
            case "1":
                mainDiagram.layout = go.GraphObject.make(go.CircularLayout);
                currentLayout = "1";
                break;
            case "2":
                mainDiagram.layout = go.GraphObject.make(go.LayeredDigraphLayout);
                currentLayout = "2";
                break;
            case "3":
                mainDiagram.layout = go.GraphObject.make(go.GridLayout);
                currentLayout = "3";
                break;
            default:
                break;
        }
        mainDiagram.commitTransaction("Change Layout");

        saveDiagramState();
    });

    /**
     * Sets the diagram layout for loading a state.
     */
    function setLayout(strLayoutNumber) {
        mainDiagram.startTransaction("Change Layout");

        switch(strLayoutNumber) {
            case "0":
                mainDiagram.layout = go.GraphObject.make(go.ForceDirectedLayout);
                currentLayout = "0";
                break;
            case "1":
                mainDiagram.layout = go.GraphObject.make(go.CircularLayout);
                currentLayout = "1";
                break;
            case "2":
                mainDiagram.layout = go.GraphObject.make(go.LayeredDigraphLayout);
                currentLayout = "2";
                break;
            case "3":
                mainDiagram.layout = go.GraphObject.make(go.GridLayout);
                currentLayout = "3";
                break;
            default:
                break;
        }
        mainDiagram.commitTransaction("Change Layout");
    }

    /**
     * Shows or hides the columns of all the tables in the current diagram.
     */
    module.exports.toggleColumns = util.client(() => {

        if(!mainDiagram) {
            return;
        }
        let visible = $('#column-toggle').hasClass('fa-eye');
        visible
            ? $('#column-toggle').removeClass('fa-eye').addClass('fa-eye-slash')
            : $('#column-toggle').removeClass('fa-eye-slash').addClass('fa-eye');

        mainDiagram.startTransaction('Toggle Columns');

        mainDiagram.nodes.each(function(n) {
            let p = n.findObject('COLS');
            if (p !== null) {
                p.visible = visible;
            }
        });
        mainDiagram.commitTransaction("Toggle Columns");
    });

    /**
     * Handles events caused by a button click.
     *
     * @param    {string}    name    table name
     */
    module.exports.buttonClickHandler = util.client((name) => {

        let linkIndices = [];

        mainDiagram.startTransaction("Readd Node");
        deletedNodes.forEach(function(node) {
            if(node.key === name) {
                reAddNodeToDiagram(node);
                let index = deletedNodes.indexOf(node);
                deletedNodes.splice(index, 1);
                //break;
            }
        });

        deletedLinks.forEach(function(link) {
            let boolAddLink = true;
            if(link.to === name) {
                deletedNodes.forEach(function(node) {
                    if(node.key === link.from) {    //link does not need to be added
                        boolAddLink = false;
                    }
                });
                if(boolAddLink) {
                    reAddLinkToDiagram(link);
                    linkIndices.push(deletedLinks.indexOf(link));
                }
            }
            else if(link.from === name) {
                deletedNodes.forEach(function(node) {
                    if(node.key === link.to) {    //link does not need to be added
                        boolAddLink = false;
                    }
                });
                if(boolAddLink) {
                    reAddLinkToDiagram(link);
                    linkIndices.push(deletedLinks.indexOf(link));
                }
            }
        });

        for(let i = linkIndices.length - 1; i >= 0; i--) {
            deletedLinks.splice(linkIndices[i], 1);
        }
        mainDiagram.commitTransaction("Readd Node");

        //delete button
        $('#' + name).remove();
    });

    /**
     * When a node is deleted, it gets added to the deleted node list.
     *
     * @param    {string}    name    table name
     */
    function addDeletedNodeToList(name) {
        console.log(deletedLinks);
        $('#deleted-tables').append(
            `<li id="${name}">
                <a
                    class="blue btn col s12"
                    onclick="require('build').buttonClickHandler('${name}')"
                >${name}</a>
            </li>`
        );
    }

    /**
     * Adds a node back to the diagram after being deleted.
     *
     * @param    {string}    name    table name
     */
    function reAddNodeToDiagram(node) {
        mainDiagram.model.addNodeData(node);
    }
    module.exports.reAddNodeToDiagram = reAddNodeToDiagram;

    /**
     * Adds a link back to the diagram after being deleted.
     */
    function reAddLinkToDiagram(link) {
        mainDiagram.model.addLinkData(link);
    }
    module.exports.reAddLinkToDiagram = reAddLinkToDiagram;

    /**
     * Toggles the Change Layout pane.
     */
    const toggleLayouts = module.exports.toggleLayouts = util.client(() => {
        $('#removed-btn').removeClass('selected');
        $('#removed-modal').hide();
        $('#layouts-btn').toggleClass('selected');
        $('#layouts-modal').toggle();
    });

    /**
     * Toggles the Deleted Nodes pane.
     */
    const toggleRemoved = module.exports.toggleRemoved = util.client(() => {
        $('#layouts-btn').removeClass('selected');
        $('#layouts-modal').hide();
        $('#removed-btn').toggleClass('selected');
        $('#removed-modal').toggle();
    });

    module.exports.mainDiagram = () => mainDiagram;

})();

if(typeof __file__ === 'function') __file__('build');