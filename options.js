var storage = {
    wishlist: new Array(),
    blacklist: new Array(),
    st_blacklist: 'l',
    st_wishlist: 'l'
};

function saveOptions() {
    /* Load */
    var checkbox1 = document.getElementById('hide_dlc');
    var checkbox2 = document.getElementById('hide_high_level');
    var checkbox3 = document.getElementById('hide_blacklist');
    var checkbox4 = document.getElementById('auto_pagination');
    var checkbox5 = document.getElementById('forum_on_top');
    var checkbox6 = document.getElementById('sticky_header');
    var text1 = document.getElementById('join_comment');
    var text2 = document.getElementById('filter_points');
    var text3 = document.getElementById('filter_percentage');

    /* Validation */
    var filterPoints = parseInt(text2.value);
    if (!isInteger(filterPoints) || filterPoints < 0) {
        filterPoints = 0;
    }

    var filterPercentage = parseFloat(text3.value);
    if (!isFloat(filterPercentage) || filterPercentage < 0) {
        filterPercentage = 0;
    }

    /* Save */
    chrome.storage.sync.set({
        'hide_dlc': checkbox1.checked,
        'hide_high_level': checkbox2.checked,
        'hide_blacklist': checkbox3.checked,
        'auto_pagination': checkbox4.checked,
        'forum_on_top': checkbox5.checked,
        'sticky_header': checkbox6.checked,
        'join_comment': text1.value,
        'filter_points': filterPoints,
        'filter_percentage': filterPercentage,
    });
}

function isInteger(x) {
    return (typeof x === 'number') && (x % 1 === 0);
}

function isFloat(x) {
    return (typeof x === 'number') && (x % 1 !== 0);
}

function restoreOptions() {
    chrome.storage.sync.get(['st_blacklist', 'st_wishlist'], function (result) {
        storage.st_blacklist = (typeof result.st_blacklist == 'undefined' ? 'l' : result.st_blacklist);
        storage.st_wishlist = (typeof result.st_wishlist == 'undefined' ? 'l' : result.st_wishlist);

        var blacklistElement = document.getElementById('blacklist').children[0].children[0].children[0].children[0];
        if (storage.st_blacklist == 's') {
            blacklistElement.innerHTML = '(sync storage)';
        } else {
            blacklistElement.innerHTML = '(local storage)';
        }

        var wishlistElement = document.getElementById('wishlist').children[0].children[0].children[0].children[0];
        if (storage.st_wishlist == 's') {
            wishlistElement.innerHTML = '(sync storage)';
        } else {
            wishlistElement.innerHTML = '(local storage)';
        }

        getSyncStorage();
    });
}

function resetSteamId() {
    chrome.storage.sync.remove('steam_id', function () {
        var profileSpan = document.getElementById('profile_refresh');
        profileSpan.style.display = 'block';
        var wislistSpan = document.getElementById('wishlist_refresh');
        wislistSpan.style.display = 'none';
    });
}

function clearParameter() {
    if (confirm('Are you sure?')) {
        st.clear(this.name);
        document.getElementById(this.name).children[0].children[1].children[0].style.display = 'none';
    }
}

function removeGameFromBlacklist() {
    var appId = this.getAttribute('appId');
    this.style.display = 'none';

    if (storage.blacklist) {
        sg.updateBl(appId, 'name', storage.blacklist);
    }
}

function getSyncStorage() {
    var options = ['hide_dlc', 'hide_high_level', 'steam_id', 'steam_gift_user', 'hide_blacklist',
        'auto_pagination', 'forum_on_top', 'sticky_header', 'join_comment', 'filter_points', 'filter_percentage'];

    for (var i = 1; i <= st.maxTubes; i++) {
        options.push('wishlist' + i.toString());
        options.push('blacklist' + i.toString());
    }

    chrome.storage.sync.get(options, function (result) {
        if (storage.st_blacklist == 's') {
            for (var i = 1; i <= st.maxTubes; i++) {
                var blacklist = (typeof result['blacklist' + i] == 'undefined' ? new Array() : result['blacklist' + i]);
                storage.blacklist = storage.blacklist.concat(blacklist);
            }
        }
        if (storage.st_wishlist == 's') {
            for (var i = 1; i <= st.maxTubes; i++) {
                var wishlist = (typeof result['wishlist' + i] == 'undefined' ? new Array() : result['wishlist' + i]);
                storage.wishlist = storage.wishlist.concat(wishlist);
            }
        }

        var hideDlc = (typeof result.hide_dlc == 'undefined' ? false : result.hide_dlc);
        var hideHighLevel = (typeof result.hide_high_level == 'undefined' ? false : result.hide_high_level);
        var hideBlacklist = (typeof result.hide_blacklist == 'undefined' ? false : result.hide_blacklist);
        var steamId = (typeof result.steam_id == 'undefined' ? null : result.steam_id);
        var steamGiftUser = (typeof result.steam_gift_user == 'undefined' ? null : result.steam_gift_user);
        var autoPagination = (typeof result.auto_pagination == 'undefined' ? true : result.auto_pagination);
        var forumOnTop = (typeof result.forum_on_top == 'undefined' ? true : result.forum_on_top);
        var stickyHeader = (typeof result.sticky_header == 'undefined' ? false : result.sticky_header);
        var joinComment = (typeof result.join_comment == 'undefined' ? '' : result.join_comment);
        var filterPoints = (typeof result.filter_points == 'undefined' ? '' : result.filter_points);
        var filterPercentage = (typeof result.filter_percentage == 'undefined' ? '' : result.filter_percentage);

        document.getElementById('hide_dlc').checked = hideDlc;
        document.getElementById('hide_high_level').checked = hideHighLevel;
        document.getElementById('hide_blacklist').checked = hideBlacklist;
        document.getElementById('auto_pagination').checked = autoPagination;
        document.getElementById('forum_on_top').checked = forumOnTop;
        document.getElementById('sticky_header').checked = stickyHeader;
        document.getElementById('join_comment').value = joinComment;
        document.getElementById('filter_points').value = filterPoints;
        document.getElementById('filter_percentage').value = filterPercentage;

        var profileSpan = document.getElementById('profile_refresh');
        var wislistSpan = document.getElementById('wishlist_refresh');

        if (steamGiftUser !== null) {
            profileSpan.children[0].href = profileSpan.children[0].href.replace('YOUR_STEAM_GIFT_USER', steamGiftUser);
            if (steamId !== null) {
                wislistSpan.children[0].href = wislistSpan.children[0].href.replace('YOUR_STEAM_ID', steamId);
                wislistSpan.style.display = 'block';
            } else {
                profileSpan.style.display = 'block';
            }
        }

        getLocalStorage();
    });
}

function getLocalStorage() {
    chrome.storage.local.get(['blacklist', 'wishlist'], function (result) {
        if (storage.st_blacklist == 'l') {
            storage.blacklist = (typeof result.blacklist == 'undefined' ? new Array() : result.blacklist);
        }
        if (storage.st_wishlist == 'l') {
            storage.wishlist = (typeof result.wishlist == 'undefined' ? new Array() : result.wishlist);
        }

        load();
    });
}

function load() {
    /* Blacklist */
    var list = document.getElementById('blacklist').children[0].children[1].children[0];
    storage.blacklist.sort(sortBy(1, true, function (a) {
        return a.toUpperCase()
    }));
    for (var i in storage.blacklist) {
        var newLI = document.createElement('li');
        var a = document.createElement("a");
        list.appendChild(newLI);
        a.setAttribute('appId', storage.blacklist[i][0]);
        a.onclick = removeGameFromBlacklist;
        a.innerHTML = parseInt(i) + 1 + '. ' + storage.blacklist[i][1];
        newLI.appendChild(a);
    }

    /* Wishlist */
    var list = document.getElementById('wishlist').children[0].children[1].children[0];
    for (var i in storage.wishlist) {
        var newLI = document.createElement('li');
        list.appendChild(newLI);
        newLI.innerHTML = parseInt(i) + 1 + '. ' + storage.wishlist[i][1];
    }
}

function showStorageSize() {
    var localElement = document.getElementById('storage-local-size');
    var syncElement = document.getElementById('storage-sync-size');
    chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
        var usage = (bytesInUse / st.maxStorageLocal) * 100;
        localElement.innerHTML = usage.toFixed(2) + '%';
    });
    chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
        var usage = (bytesInUse / st.maxStorageSync) * 100;
        syncElement.innerHTML = usage.toFixed(2) + '%';
    });
}

function sortBy(field, reverse, primer) {
    var key = function (x) {
        return primer ? primer(x[field]) : x[field]
    };

    return function (a, b) {
        var A = key(a), B = key(b);
        return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1, 1][+!!reverse];
    }
}

function exportBlacklist() {
    var blacklistTextarea = document.getElementById('blacklist-textarea');
    blacklistTextarea.value = JSON.stringify(storage.blacklist);
}

function importBlacklist() {
    var blacklistTextarea = document.getElementById('blacklist-textarea');

    if (blacklistTextarea.value == '') {
        alert('Field can\'t be empty');
        return;
    }

    if (validateBlacklistJson(blacklistTextarea.value)) {
        var newList = JSON.parse(blacklistTextarea.value);
        st.update('blacklist', newList);
        alert('Blacklist imported');
        location.reload();
    } else {
        alert('Import data is not correct');
        return false;
    }

}

function validateBlacklistJson(str) {

    try {
        json = JSON.parse(str);
    } catch (exception) {
        return false;
    }

    for (var i = 0; i < json.length; ++i) {
        if (typeof json[i][0] !== 'number') {
            return false
        }
        if (typeof json[i][1] !== 'string' || json[i][1] == '') {
            return false
        }
    }

    return true;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('DOMContentLoaded', showStorageSize);

var inputs = document.getElementsByTagName('input');
for (var i = 0; i < inputs.length; ++i) {
    inputs[i].addEventListener('change', saveOptions);
}
var selects = document.getElementsByTagName('select');
for (var i = 0; i < selects.length; ++i) {
    selects[i].addEventListener('change', saveOptions);
}

var steamIdReset = document.getElementById('steam_id_reset');
steamIdReset.addEventListener('click', resetSteamId);

var clearBtns = document.getElementsByClassName('clear');
for (var i = 0; i < clearBtns.length; ++i) {
    clearBtns[i].addEventListener('click', clearParameter);
}

var blacklistExportBtn = document.getElementById('blacklist-export');
blacklistExportBtn.addEventListener('click', exportBlacklist);

var blacklistImportBtn = document.getElementById('blacklist-import');
blacklistImportBtn.addEventListener('click', importBlacklist);
