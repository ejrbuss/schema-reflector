(function() {

    module.exports = (context={}) =>
        `<div class="row"></div>
        <div class="row">
            <div class="col s4">
                <a href="https://www.google.com/doodles/30th-anniversary-of-pac-man" target="_blank">
                    <img class="responsive-img animated bounceInLeft" src="/images/pacman.png">
                </a>
            </div>
            <div class="col s8">
                    <div class="card-content grey-text text-darken-3">
                        <h2 class="pink-text text-accent-3 bold">Here There be Monsters</h2>
                        <h3>${context.error}</h3>
                        <p>${context.message}</p>
                    </div>
                    <a class="blue btn white-text" href="/home">Take me home!</a>
            </div>
        </div>`;

})();

if(typeof __file__ === 'function') __file__('error');
