getSteamId();
//updateDetails();

function getSteamId() {
    chrome.storage.sync.get(['steam_id'], function (result) {
        if(typeof result.steam_id == 'undefined') {
            var steamId = vis.getSteamId();
            chrome.storage.sync.set({'steam_id': steamId}, function () {});
        }
    });
}

function updateDetails() {
    sg.updateProfileDetails();
}