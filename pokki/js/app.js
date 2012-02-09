var SnakeDemocracyApp = function()
{
    // get local storage
    var badges = new LocalStore('badges', {defaultVal: true});
    var shownPlayerCount = new LocalStore('shownPlayerCount', {defaultVal: 0});
    
    // get used DOM elements
    var wrapper = document.getElementById('wrapper');
    var badgeOnImgs =
    {
        set : document.getElementById('pokki-badgeon-set'),
        hover : document.getElementById('pokki-badgeon-hover'),
        unset : document.getElementById('pokki-badgeon-unset'),
    };
    var badgeOffImgs =
    {
        set : document.getElementById('pokki-badgeoff-set'),
        hover : document.getElementById('pokki-badgeoff-hover'),
        unset : document.getElementById('pokki-badgeoff-unset'),
    };

    // attach click event to minimize button
    var minimize = document.getElementById('minimize');
    minimize.addEventListener('click', pokki.closePopup);
    
    // initialize client
    //init("http://snakedemocracy.herokuapp.com", false, true);
    init("http://snakedemocracy:3000/", false, true);
    
    // the background page will attempt to restart us once in a while
    this.restartIfStopped = function()
    {
        pokkiRestartIfStopped();
    }
        
    // kick off what needs to be done whenever the popup is about to be shown
    this.onPopupShowing = function()
    {    
        // fade in wrapper
        wrapper.classList.add('show');

        // tell the SD client
        pokkiShowing();
    };
    
    // kick off what needs to be done when the popup is shown
    this.onPopupShown = function()
    {
        // we're now shown, hiding badges
        this.applyBadges();

        // tell the SD client
        pokkiShown();
    };
    
    // kick off what needs to be done when the popup is hidden
    this.onPopupHidden = function()
    {
        // reset wrapper animation
        wrapper.classList.remove('show');
        
        // we're now hidden, remember how many players were active
        shownPlayerCount.set(pokkiGetActivePlayerCount());

        // tell the SD client
        pokkiHidden();
    };
    
    // use this to store anything needed to restore state when the user opens
    // the Pokki again
    this.onPopupUnload = function()
    {
        // tell the SD client
        pokkiUnload();
    };
    
    // called when showing/hidden and from background.js to update the badge
    this.applyBadges = function()
    {
        // if badges enabled and popup hidden, show newly active players
        if (badges.get() && !pokki.isPopupShown())
        {
            var diff = pokkiGetActivePlayerCount() - shownPlayerCount.get();
            if (diff > 0)
            {
                console.log("New player(s) detected " + diff);
                pokki.setIconBadge(diff);
            }
            else
            {
                console.log("No new player");
                pokki.removeIconBadge();
            }
        }
        // otherwise clear it
        else
        {
            console.log("Badges off or popup shown");
            pokki.removeIconBadge();
        }
    };
    
    // called from popup.html and context menu to turn badges on/off
    this.switchBadges = function(_onOff, _force)
    {
        if (badges.get()==_onOff && !_force)
        {
            return;
        }

        badges.set(_onOff);

        // update images
        if (_onOff)
        {
            console.log("Badges on.");
            
            badgeOnImgs.set.style.visibility = "visible";
            badgeOnImgs.unset.style.visibility = "hidden";

            badgeOffImgs.set.style.visibility = "hidden";
            badgeOffImgs.unset.style.visibility = "visible";
        }
        else
        {
            console.log("Badges off.");

            badgeOnImgs.set.style.visibility = "hidden";
            badgeOnImgs.unset.style.visibility = "visible";

            badgeOffImgs.set.style.visibility = "visible";
            badgeOffImgs.unset.style.visibility = "hidden";
        }
    };
    this.switchBadges(badges.get(), true); // set initial state
  
};