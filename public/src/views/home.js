(function() {

    module.exports = context =>
        `<div class="row">
            <div class="col s12">
                <img src="images/title.png" class="fill">
            </div>
            <div class="col s8 center-align push-s2">
                <h2 class="blue-text">Discover Your Schema</h2>
                <p class="grey-text text-darken-3 flow-text">
                    Schema Reflector is a tool to help you understand your database.
                    Built to help reverse engineer the massive database for OSCAR EMR
                    we give you the tools to understand and explore any SQL database.
                </p>
            </div>
            <div class="col s12 spacer"></div>
            <div class="col s6 center-align">
                <i class="fa fa-database fa-img blue-text"></i>
            </div>
            <div class="col s6 center-align">
                <h3 class="blue-text">Connect</h3>
                <p class="grey-text text-darken-3 flow-text">
                    The first step in discovering your schema is to connect to your
                    database. Just enter your database configuration information
                    from the connect menu and you will be on your way.
                </p>
                <a href="/connect" class="btn blue">Connect Your Database</a>
            </div>
            <div class="col s12 spacer"></div>
            <div class="col s6 center-align">
                <h3 class="blue-text">Explore</h3>
                <p class="grey-text text-darken-3 flow-text">
                    Once your connected you can take a look at all the tables in your
                    database. Our table index allows you to drill down into every table
                    and see a close up view of how every column is configured.
                </p>
                <a href="/tables" class="btn blue">Explore Your Tables</a>
            </div>
            <div class="col s6 center-align">
                <i class="fa fa-list fa-img blue-text" ></i>
            </div>
            <div class="col s12 spacer"></div>
            <div class="col s6 center-align">
                <i class="fa fa-map fa-img blue-text"></i>
            </div>
            <div class="col s6 center-align">
                <h3 class="blue-text">Get a Roadmap of your Database</h3>
                <p class="grey-text text-darken-3 flow-text">
                    Here you can view ER diagrams of your database. Find the connections
                    between your tables.
                </p>
                <a href="/abstract" class="btn blue">Explore the Abstract View</a>
                <br>
                <br>
                <a href="/concrete" class="btn blue">Explore the Concrete View</a>
            </div>
            <div class="col s12 spacer"></div>
        </div>`;

})();

if(typeof __file__ === 'function') __file__('home');
