sg.getUserData();

var storage = {};
var dlcCheckIteration = 0;
var currentPage = vis.getCurrentPage();
var nextPage = currentPage + 1;

$(document).bind('game_list_complete', updateStorage);

chrome.storage.sync.set({'steam_gift_user': sg.user});

/* START */
getStorageType();
addObservers();

function getStorageType() {
    chrome.storage.sync.get(['st_blacklist', 'st_wishlist'], function (result) {
        storage.st_blacklist = (typeof result.st_blacklist == 'undefined' ? 'l' : result.st_blacklist);
        storage.st_wishlist = (typeof result.st_wishlist == 'undefined' ? 'l' : result.st_wishlist);

        getSyncStorage();
    });
}

function getSyncStorage() {
    var options = ['hide_dlc', 'hide_high_level', 'updated_at', 'hide_blacklist',
        'auto_pagination', 'forum_on_top', 'sticky_header', 'filter_points', 'filter_percentage'];

    for (var i = 1; i <= st.maxTubes; i++) {
        options.push('wishlist' + i.toString());
        options.push('blacklist' + i.toString());
    }

    chrome.storage.sync.get(options, function (result) {
        var date = new Date();
        var day = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();

        storage.hideDlc = (typeof result.hide_dlc == 'undefined' ? false : result.hide_dlc);
        storage.hideHighLevel = (typeof result.hide_high_level == 'undefined' ? false : result.hide_high_level);
        storage.updatedAt = (typeof result.updated_at == 'undefined' ? {games: day} : result.updated_at);
        storage.hideBlacklist = (typeof result.hide_blacklist == 'undefined' ? false : result.hide_blacklist);
        storage.autoPagination = (typeof result.auto_pagination == 'undefined' ? true : result.auto_pagination);
        storage.forumOnTop = (typeof result.forum_on_top == 'undefined' ? true : result.forum_on_top);
        storage.stickyHeader = (typeof result.sticky_header == 'undefined' ? false : result.sticky_header);
        storage.blacklist = new Array();
        storage.wishlist = new Array();
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
        storage.hideBlacklist = (typeof result.hide_blacklist == 'undefined' ? false : result.hide_blacklist);
        storage.filterPoints = (typeof result.filter_points == 'undefined' ? 0 : result.filter_points);
        storage.filterPercentage = (typeof result.filter_percentage == 'undefined' ? 0 : result.filter_percentage);
        getLocalStorage();
        if (storage.forumOnTop) {
            vis.moveDiscussionToTop();
        }
        if (storage.autoPagination && typeof vis.getUrlParameter('type') == 'undefined') {
            vis.addPageLoaderInfo();
            bindScroll();
        }
        if (storage.stickyHeader) {
            vis.enableStickyHeader();
        }
    });
}

function bindScroll() {
    $(window).scroll(function () {
        if (($(window).scrollTop() + $(window).height() > $(document).height() - 1100) && nextPage <= 30) {
            $(window).unbind('scroll');
            vis.showPageLoaderInfo();
            $.get("https://www.steamgifts.com/giveaways/search?page=" + nextPage, function (html) {
                var nextGiveawayList = vis.getGiveawayList(html);
                vis.getGiveawayList().last().after(nextGiveawayList);
                vis.hidePageLoaderInfo();
                nextPage++;
                bindScroll();
                sg.getGiveaways(html);
                getDlcList();
                vis.updateDonators();
            });
        }
    });
}

function getLocalStorage() {
    chrome.storage.local.get(['game_list', 'blacklist', 'wishlist'], function (result) {
        storage.games = (typeof result.game_list == 'undefined' ? new Array() : result.game_list);
        if (storage.st_blacklist == 'l') {
            storage.blacklist = (typeof result.blacklist == 'undefined' ? new Array() : result.blacklist);
        }
        if (storage.st_wishlist == 'l') {
            storage.wishlist = (typeof result.wishlist == 'undefined' ? new Array() : result.wishlist);
        }

        sg.storage = storage;
        sgRun();
    });
}

function sgRun() {
    sg.addNews('Good luck in 2017 !');
    sg.refreshStorage();
    sg.getGiveaways();
    getDlcList();
}

function getDlcList() {
    dlcCheckIteration = 0;

    for (var i in sg.games) {
        if (sg.games[i].data.appId === null || sg.games[i].data.image === null) {
            dlcCheckIteration = dlcCheckIteration + 1;
            if (dlcCheckIteration >= sg.appsCount) {
                $(document).trigger('game_list_complete');
            }
        } else {
            checkIfGameIsDlc(i);
        }
    }
}

function checkIfGameIsDlc(i) {
    var foundResult = sg.findStorageGame(sg.games[i].data.appId);
    if (foundResult.result == false) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        var dlc = $.Deferred();
        var url = sg.games[i].data.image;
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState == 4 && xhr.status == 200) {
                dlc.resolve(this.response);
            } else if (xhr.readyState == 4 && xhr.status == 404) {
                sg.games[i].data.base64 = null;
                checkGameColors(i);
            }
        }
        $.when(dlc).done(function (dlc_file) {
            var reader = new FileReader();
            reader.onload = function (event) {
                sg.games[i].data.base64 = event.target.result;
                checkGameColors(i);
            };
            reader.readAsDataURL(dlc_file);
        });
        xhr.send();
    } else {
        sg.games[i].data.isDlc = sg.storage.games[foundResult.i].data.isDlc;
        sg.games[i].data.base64 = sg.storage.games[foundResult.i].data.base64;
        dlcCheckIteration = dlcCheckIteration + 1;
        if (dlcCheckIteration >= sg.appsCount) {
            $(document).trigger('game_list_complete');
        }
    }
}

function checkGameColors(i) {
    if (sg.games[i].data.base64 == null) {
        sg.games[i].data.isDlc = false;

        dlcCheckIteration = dlcCheckIteration + 1;
        if (dlcCheckIteration >= sg.appsCount) {
            $(document).trigger('game_list_complete');
        }
    } else {
        var imageDlcCoord = new Array([32, 3], [30, 6], [29, 9], [27, 3], [23, 14], [20, 18], [15, 3], [9, 6], [6, 30], [5, 31], [2, 36]);
        var imageObj = new Image();
        var colors = new Array();
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var imageWidth = 40;
        var imageHeight = 40;
        var dlc = {hue: [284, 304], light: [30, 54], sat: [47, 55]};

        imageObj.onload = function () {
            context.drawImage(imageObj, 0, 0);
            var data = context.getImageData(0, 0, imageWidth, imageHeight).data;
            var isDlc = true;
            for (var k in imageDlcCoord) {
                if (isDlc == true) {
                    var colors = sg.getHslColor(data, imageWidth, imageDlcCoord[k][0], imageDlcCoord[k][1]);

                    if (colors[0] < dlc.hue[0] || colors[0] > dlc.hue[1]) {
                        isDlc = false;
                    }
                    if (colors[1] < dlc.light[0] || colors[1] > dlc.light[1]) {
                        isDlc = false;
                    }
                    if (colors[2] < dlc.sat[0] || colors[2] > dlc.sat[1]) {
                        isDlc = false;
                    }
                }
            }
            sg.games[i].data.isDlc = isDlc;

            dlcCheckIteration = dlcCheckIteration + 1;
            if (dlcCheckIteration >= sg.appsCount) {
                $(document).trigger('game_list_complete');
            }
        };

        imageObj.src = sg.games[i].data.base64;
    }
}

function updateStorage() {
    var update = false;
    for (var k in sg.games) {
        if (sg.games[k].data.appId !== null) {
            var foundResult = sg.findStorageGame(sg.games[k].data.appId);
            if (foundResult.result == false) {
                sg.storage.games.push({data: sg.games[k].data});
                update = true;
            }
        }
    }
    if (update) {
        chrome.storage.local.set({'game_list': sg.storage.games}, updateMainPage());
    } else {
        updateMainPage();
    }
}

function updateMainPage() {
    vis.updateGiveawayListPage();
    vis.updateDonators();
}

function addObservers() {
    $(document).on('click', '.esg-join > a', function () {
        chrome.extension.sendRequest({ action: 'join', href: 'https://www.steamgifts.com' + $(this).attr('joinHref') });
        vis.setGiveawayJoined($(this));
        return false;
    });

    $(document).on('click', '.esg-bl-link', function () {
        var giveaway = vis.setGiveawayBl($(this));
        sg.storage.blacklist = sg.updateBl(giveaway.appId, giveaway.name, sg.storage.blacklist);
        return false;
    });
}
