// NB: in an ideal world, the app would use the MVC pattern, the popup beeing
// the view and the controller, and this background script being the model
// running all the time. This would allow to get active player notifications
// even when the popup gets unloaded, but this would also mean heavy refactoring
// for the SD client... So we're keeping that for later.

// access to badges switch local storage
var badgesSwitch = new LocalStore("badgesSwitch", {defaultVal: true});

// poll for badges every minute
// Pokki Guidelines: Badges
function updateBadges()
{
    var loaded = pokki.rpc("POPUP_LOADED");
    if (loaded)
    {
        pokki.rpc("SD.refreshBadges()");
    }
}
setInterval(updateBadges, 6000);

// if stopped, attempt a restart every ~23s
// Pokki Guidelines: Network connection issues
function restartIfStopped()
{
    var loaded = pokki.rpc("POPUP_LOADED");
    if (loaded)
    {
        pokki.rpc("SD.restartIfStopped()");
    }
}
setInterval(restartIfStopped, 23456);

// context menu
function refreshContextMenu()
{
    pokki.resetContextMenu();
    pokki.addContextMenuItem("How to play? (external link)", "faq");
    pokki.addContextMenuItem("About (external link)", "about");
    if (badgesSwitch.get())
    {
        pokki.addContextMenuItem("New player notifications: switch off", "badgeoff");
    }
    else
    {
        pokki.addContextMenuItem("New player notifications: switch on", "badgeon");
    }
};
refreshContextMenu();

// context menu listener
pokki.addEventListener("context_menu", function(_id)
{
    console.log("Menu item selected! Identifier: " + _id);
    if (_id == "faq")
    {
        pokki.openURLInDefaultBrowser("http://snakedemocracy.com/faq.html");
    }
    else if (_id == "about")
    {
        pokki.openURLInDefaultBrowser("http://snakedemocracy.com/about.html");
    }
    else if (_id == "badgeoff")
    {
        badgesSwitch.set(false);
        var loaded = pokki.rpc("POPUP_LOADED");
        if (loaded)
        {
            pokki.rpc("SD.refreshBadges()");
        }
        if (pokki.isPopupShown())
        {
            pokki.rpc("SD.refreshBadgesOnOffSwitch()");
        }
        refreshContextMenu();
    }
    else if (_id == "badgeon")
    {
        badgesSwitch.set(true);
        var loaded = pokki.rpc("POPUP_LOADED");
        if (loaded)
        {
            pokki.rpc("SD.refreshBadges()");
        }
        if (pokki.isPopupShown())
        {
            pokki.rpc("SD.refreshBadgesOnOffSwitch()");
        }
        refreshContextMenu();
    }
});
