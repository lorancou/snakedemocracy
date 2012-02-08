var SnakeDemocracyApp = function()
{
    var unloaded = new LocalStore('unloaded');

    // attach click event to minimize button
    var minimize = document.getElementById('minimize');
    minimize.addEventListener('click', pokki.closePopup);
    
    // initialize client
    init("http://snakedemocracy.herokuapp.com", false, true); // init SD
    
    // kick off what needs to be done whenever the popup is about to be shown
    this.onPopupShowing = function()
    {    
        pokkiShowing();
    };
    
    // kick off what needs to be done when the popup is shown
    this.onPopupShown = function()
    {
        // animate wrapper
        // NB: this seems unecessary, but keeping it here just in case
        // -> to re-enable it, don't forget to set wrapper initial opacity to 0
        /*var wrapper = document.getElementById('wrapper');
        wrapper.classList.add('show');
        unloaded.remove();*/

        pokkiShown();
    };
    
    // kick off what needs to be done when the popup is hidden
    this.onPopupHidden = function()
    {
        // reset wrapper animation
        //wrapper.classList.remove('show');
        
        pokkiHidden();
    };
    
    // use this to store anything needed to restore state when the user opens
    // the Pokki again
    this.onPopupUnload = function()
    {
        // remember we were unloaded once
        unloaded.set(true);

        pokkiUnload();
    };
};