var SnakeDemocracyApp = function()
{
    // get local storage
    var badgesSwitch = new LocalStore("badgesSwitch", {defaultVal: true});
    var sfxSwitch = new LocalStore("sfxSwitch", {defaultVal: true});
    var shownPlayerCount = new LocalStore("shownPlayerCount", {defaultVal: 0});
    
    // get used DOM elements
    var wrapper = document.getElementById('wrapper');
    var badgeOnLink = document.getElementById('pokki-badgeon');
    var badgeOnImgs =
    {
        set : document.getElementById('pokki-badgeon-set'),
        unset : document.getElementById('pokki-badgeon-unset'),
    };
    var badgeOffLink = document.getElementById('pokki-badgeoff');
    var badgeOffImgs =
    {
        set : document.getElementById('pokki-badgeoff-set'),
        unset : document.getElementById('pokki-badgeoff-unset'),
    };
    var sfxOnLink = document.getElementById('pokki-sfxon');
    var sfxOnImgs =
    {
        set : document.getElementById('pokki-sfxon-set'),
        unset : document.getElementById('pokki-sfxon-unset'),
    };
    var sfxOffLink = document.getElementById('pokki-sfxoff');
    var sfxOffImgs =
    {
        set : document.getElementById('pokki-sfxoff-set'),
        unset : document.getElementById('pokki-sfxoff-unset'),
    };

    // attach click event to minimize button
    var minimize = document.getElementById('minimize');
    minimize.addEventListener('click', pokki.closePopup);
    
    // initialize client
    init("http://snakedemocracy.herokuapp.com", false, true);
    //init("http://snakedemocracy:3000/", false, true);
   
    // the background page will attempt to restart us once in a while
    this.restartIfStopped = function()
    {
        pokkiRestartIfStopped();
    }
        
    // kick off what needs to be done whenever the popup is about to be shown
    this.onPopupShowing = function()
    {    
        // tell the SD client
        pokkiShowing();
    };
    
    // kick off what needs to be done when the popup is shown
    this.onPopupShown = function()
    {
        // fade in wrapper
        wrapper.classList.remove('show');
        wrapper.classList.add('show');

        // we're now shown, hiding badges
        this.refreshBadges();

        // refresh switches
        this.refreshBadgesOnOffSwitch();
        this.refreshSfxOnOffSwitch();

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
    
    // called when shown/hidden and from background.js to update the badge
    this.refreshBadges = function()
    {
        // if badges enabled and popup hidden, show newly active players
        if (badgesSwitch.get() && !pokki.isPopupShown())
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
    this.refreshBadges(); // set initial state
    
    // called when shown/hidden and from background.js to update the badge
    this.refreshBadges = function()
    {
        // if badges enabled and popup hidden, show newly active players
        if (badgesSwitch.get() && !pokki.isPopupShown())
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
    this.refreshBadges(); // set initial state

    // called from background.js to update the popup switch buttons
    this.refreshBadgesOnOffSwitch = function()
    {
        if (badgesSwitch.get())
        {
            console.log("Badges on.");
            
            badgeOnLink.style.visibility = "hidden";
            badgeOnImgs.set.style.visibility = "visible";
            badgeOnImgs.unset.style.visibility = "hidden";

            badgeOffLink.style.visibility = "visible";
            badgeOffImgs.set.style.visibility = "hidden";
            badgeOffImgs.unset.style.visibility = "visible";
        }
        else
        {
            console.log("Badges off.");

            badgeOnLink.style.visibility = "visible";
            badgeOnImgs.set.style.visibility = "hidden";
            badgeOnImgs.unset.style.visibility = "visible";

            badgeOffLink.style.visibility = "hidden";
            badgeOffImgs.set.style.visibility = "visible";
            badgeOffImgs.unset.style.visibility = "hidden";
        }
    };
    this.refreshBadgesOnOffSwitch(); // set initial state

    // called from popup.html
    this.switchBadges = function(_onOff)
    {
        badgesSwitch.set(_onOff);
        
        // update context menu
        pokki.rpc("refreshContextMenu()");

        // update images
        this.refreshBadgesOnOffSwitch();
    };
  
    // called from background.js to update the popup switch buttons
    this.refreshSfxOnOffSwitch = function()
    {
        if (sfxSwitch.get())
        {
            console.log("Badges on.");
            
            sfxOnLink.style.visibility = "hidden";
            sfxOnImgs.set.style.visibility = "visible";
            sfxOnImgs.unset.style.visibility = "hidden";

            sfxOffLink.style.visibility = "visible";
            sfxOffImgs.set.style.visibility = "hidden";
            sfxOffImgs.unset.style.visibility = "visible";
        }
        else
        {
            console.log("Badges off.");

            sfxOnLink.style.visibility = "visible";
            sfxOnImgs.set.style.visibility = "hidden";
            sfxOnImgs.unset.style.visibility = "visible";

            sfxOffLink.style.visibility = "hidden";
            sfxOffImgs.set.style.visibility = "visible";
            sfxOffImgs.unset.style.visibility = "hidden";
        }
    };
    this.refreshSfxOnOffSwitch(); // set initial state

    // called from popup.html
    this.switchSfx = function(_onOff)
    {
        sfxSwitch.set(_onOff);
        
        // update context menu
        pokki.rpc("refreshContextMenu()");

        // update images
        this.refreshSfxOnOffSwitch();
        
        // tell the SD client
        pokkiSwitchSfx(_onOff);
    };

    // called from background.js
    this.applySfx = function()
    {
        // tell the SD client
        pokkiSwitchSfx(sfxSwitch.get());
    };
    this.applySfx(sfxSwitch.get()); // set initial state

};