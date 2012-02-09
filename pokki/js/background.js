// NB: in an ideal world, the app would use the MVC pattern, the popup beeing
// the view and the controller, and this background script being the model
// running all the time. This would allow to get active player notifications
// even when the popup gets unloaded, but this would also mean heavy refactoring
// for the SD client... So we're keeping that for later.

// poll for badges every minute
// Pokki Guidelines: Badges
function updateBadges()
{
    var ok = pokki.rpc("POPUP_LOADED");
    if (ok)
    {
        pokki.rpc("SD.applyBadges()");
    }
}
setInterval(updateBadges, 6000);

// if stopped, attempt a restart every ~23s
// Pokki Guidelines: Network connection issues
function restartIfStopped()
{
    var ok = pokki.rpc("POPUP_LOADED");
    if (ok)
    {
        pokki.rpc("SD.restartIfStopped()");
    }
}
setInterval(restartIfStopped, 23456);
