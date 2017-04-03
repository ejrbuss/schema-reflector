(function() {

    module.exports = (context={ dir : '' }, click) =>
        `<div class="row">
            <form class="col s12">
                <div class="row">
                    <div class="input-field col s12">
                        <input value="${context.name || ''}" id="${context.dir}-name" type="text">
                        <label for="${context.dir}-name">Connection Name</label>
                    </div>
                    <div class="input-field col s8">
                        <input value="${context.host || ''}" id="${context.dir}-host" type="text">
                        <label for="${context.dir}-host">Host Name</label>
                    </div>
                    <div class="input-field col s4">
                        <input value="${context.port || ''}" id="${context.dir}-port" type="number">
                        <label for="${context.dir}-disabled">Port</label>
                    </div>
                    <div class="input-field col s6">
                        <input value="${context.user || ''}" id="${context.dir}-user" type="text">
                        <label for="${context.dir}-user">Username</label>
                    </div>
                    <div class="input-field col s6">
                        <input value="${context.password || ''}" id="${context.dir}-password" type="password">
                        <label for="${context.dir}-password">Password</label>
                    </div>
                    <div class="input-field col s12">
                        <input value="${context.database || ''}" id="${context.dir}-database" type="text">
                        <label for="${context.dir}-database">Database Name</label>
                    </div>
                    <div class="input-field col s12">
                        <input value="${context.source || ''}" id="${context.dir}-source" type="text">
                        <label for="${context.dir}-source">Source Folder</label>
                    </div>
                </div>
            </form>
            <div class="col s12 center-align">
                <button onclick="require('connect').connect('${context.dir}')" class="btn blue">Connect</button>
                ${context.dir
                    ? `<button onclick="require('connect').clearState('${context.dir}')" class="btn red">Clear Cache</button>`
                    : ''
                }
            </div>
        </div>
    `;

})();

if(typeof __file__ === 'function') __file__('connection');

