/**
 * @author torreyr
 *
 * Provides image export functionality.
 */
(function() {

    const util = require('../util');
    const log  = require('../log');

    /**
     * Exports an PNG image of the part of the diagram that is currently in view.
     */
    const makeImage = util.client(() => {

        const schema = require('../db/schema');
        let mainDiagram = require('./build').mainDiagram();

        let old_scale = mainDiagram.scale;
        let old_pos   = mainDiagram.position;
        mainDiagram.zoomToFit();

        let src = mainDiagram.makeImageData({
            background: "#EEEEEE", //"white",
            type: "image/png",
            showTemporary: true
        });

        mainDiagram.scale = old_scale
        mainDiagram.position = old_pos;

        let url = src
            .replace(/^data:image\/*\w\w[^;]/, 'data:application/octet-stream');

        log.debug(url);

        let a;
        if ((a = document.getElementById("image")) == null) {
            a = document.createElement("a");
        }

        document.body.appendChild(a);
        a.id       = "image";
        a.href     = url;
        a.download = "image.png";
        a.click();
    });

    module.exports = { makeImage };

})();

if(typeof __file__ === 'function') __file__('figure');