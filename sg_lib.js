var sg = {
    user: null,
    points: 0,
    pointsLeft: 0,
    storage: {
        games: new Array(),
        wishlist: new Array(),
        blacklist: new Array(),
        hideDlc: false,
        updatedAt: null,
        st_blacklist: 'l',
        st_wishlist: 'l'
    },
    games: new Array(),
    appsCount: 0,
    votesCount: 0,
    refreshTime: 1,
    getUserData: function () {
        this.user = vis.getUser();
        this.points = vis.getPoints();
        this.pointsLeft = this.points;
    },
    addNews: function (message) {
        vis.addNews(message);
    },
    getGiveaways: function (html) {
        var sg = this;
        var list = vis.getGiveawaysData(html);
        var lineNumber = 0;
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            var localSearch = sg.findLocalGame(item.appId);
            if (localSearch.result == true) {
                sg.games[localSearch.i].items.push({
                    line: lineNumber,
                    href: item.href,
                    timeRemaining: item.timeRemaining,
                    entries: item.entries,
                    created: item.created,
                    copies: item.copies,
                    chance: item.chance,
                    joined: item.joined
                });
            } else {
                var gameItems = new Array();
                gameItems.push({
                    line: lineNumber,
                    href: item.href,
                    timeRemaining: item.timeRemaining,
                    entries: item.entries,
                    created: item.created,
                    copies: item.copies,
                    chance: item.chance,
                    joined: item.joined
                });

                var storageSearch = sg.findStorageGame(item.appId);
                if (storageSearch.result == true) {
                    sg.games.push({
                        data: sg.storage.games[storageSearch.i].data,
                        items: gameItems
                    });
                } else {
                    sg.games.push({
                        data: {
                            appId: item.appId,
                            points: item.points,
                            image: item.image,
                            isDlc: null,
                            contributor: item.contributor
                        },
                        items: gameItems
                    });
                }
            }
            lineNumber++;
        }
        this.updateGiveawaysCount();
    },
    updateGiveawaysCount: function () {
        this.appsCount = 0; //change varname later
        this.votesCount = 0; //change varname later

        for (var i in this.games) {
            this.appsCount++;
            for (var k in this.games[i].items) {
                this.votesCount++;
            }
        }
    },
    isDonator: function (sgUsername) {
        var sgUserNames = ['MeDAN', 'iMAGICIALoTV', 'Torque1979', 'Wiegraf', 'Tirith', 'SleepyyNet', 'Jmopel', 'DARKKi', 'Logey'];

        if (sgUsername != null) {
            var resultSg = sgUserNames.indexOf(sgUsername);
            if (resultSg != -1) {
                return true;
            }
        }
        return false;
    },
    refreshStorage: function () {
        var sg = this;
        var diffDays = parseInt((new Date() - new Date(this.storage.updatedAt.games)) / (1000 * 60 * 60 * 24));

        chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
            var usage = (bytesInUse / st.maxStorageLocal) * 100;
            if (usage > 90) {
                sg.storage.games = new Array();
                chrome.storage.local.set({'game_list': sg.storage.games});
            } else if (diffDays >= sg.refreshTime) {
                sg.storage.games = new Array();
                chrome.storage.local.set({'game_list': sg.storage.games});
            }
        });
    },
    findLocalGame: function (appId) {
        for (var i in this.games) {
            if (this.games[i].data.appId == appId) {
                return {result: true, i: i};
            }
        }

        return {result: false};
    },
    findStorageGame: function (appId) {
        for (var i in this.storage.games) {
            if (this.storage.games[i].data.appId == appId) {
                return {result: true, i: i};
            }
        }

        return {result: false};
    },
    findWishlistGame: function (appId) {
        for (var i in this.storage.wishlist) {
            if (this.storage.wishlist[i][0] == appId) {
                return {result: true, i: i};
            }
        }

        return {result: false};
    },
    findBlacklistGame: function (appId) {
        for (var i in this.storage.blacklist) {
            if (this.storage.blacklist[i][0] == appId) {
                return {result: true};
            }
        }

        return {result: false};
    },
    updatePointsLeft: function (removePoints) {
        var sg = this;
        this.pointsLeft = this.pointsLeft - parseInt(removePoints);
    },
    updateBl: function (appId, name, list) {
        var index = 0;
        var refreshedList = new Array();
        var existed = false;

        for (var i in list) {
            if (typeof list[i][0] == 'number' && list[i][0] != appId) {
                refreshedList[index] = list[i];
                index++;
            } else {
                existed = true;
            }
        }

        if (existed == false) {
            refreshedList[index] = new Array();
            refreshedList[index][0] = appId;
            refreshedList[index][1] = name;
        }

        st.update('blacklist', refreshedList);

        return refreshedList;
    },
    getSteamId: function () {
        /* Profile page */
        var steamId = null;
        $('div.profile > div.left > div.details > div.row').each(function () {
            var rowName = $('> div.row_left', $(this)).text();

            if (rowName == 'Steam Profile') {
                var res = $('> div.row_right > a', $(this)).attr('href').match(/[^/]+$/);
                if (res !== null) {
                    steamId = res[0];
                }
            }
        });
        return steamId;
    },
    updatePagination: function (page, newResults) {
        $('.pagination .results').each(function () {
            var count = $('> strong:nth-child(2)', $(this));
            var newValue = parseInt(count.text()) + newResults
            count.text(newValue);
        });
        $('.pagination .numbers a').each(function () {
            var checkPattern = 'open\/page\/' + page;
            if ($(this).attr('href').match(checkPattern)) {
                $(this).addClass('selected');
            }
        });
    },
    updateProfileDetails: function () {
        /* Profile page */
        var details = $('div.profile > div.left > div.details');
        var rowPattern = '<div class="divider"></div><div class="row esg-row"><div class="row_left">[eSG] %LABEL%</div><div class="row_right">%VALUE%</div><div class="clear_both"></div></div>';
        var givewaysEntered = null;
        var giftsWon = null;
        var sgUsername = $('.heading strong', details).html();

        $('div.profile > div.left > div.details > div.row').each(function () {
            var rowName = $('> div.row_left', $(this)).text();

            if (rowName == 'Giveaways Entered') {
                givewaysEntered = parseInt($('> div.row_right', $(this)).text().replace(',', ''));
            } else if (rowName == 'Gifts Won') {
                giftsWon = parseInt($('> div.row_right', $(this)).text().replace(',', ''));
            }
        });

        if (givewaysEntered != null && givewaysEntered > 0) {
            var luck = rowPattern;
            var luck = luck.replace('%LABEL%', 'Luck');
            var luck = luck.replace('%VALUE%', ((giftsWon / givewaysEntered) * 100).toFixed(3) + '%');
            details.append(luck);
        }
        if (sg.isDonator(sgUsername)) {
            var star = '<img src="' + chrome.extension.getURL("/img/star.gif") + '"/>';
            var donator = rowPattern;
            var donator = donator.replace('[eSG] %LABEL%', star + ' Easy Steam Gifts Donator ' + star);
            var donator = donator.replace('%VALUE%', '');
            details.append(donator);
        }
    },
    getHslColor: function (data, imageWidth, x, y) {
        var red = data[((imageWidth * y) + x) * 4];
        var green = data[((imageWidth * y) + x) * 4 + 1];
        var blue = data[((imageWidth * y) + x) * 4 + 2];
        var hsl = sg.rgbToHsl(red, green, blue);

        return hsl;
    },
    rgbToHsl: function (r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
    }
}

var st = {
    maxStorageLocal: 5242880,
    maxStorageSync: 102400,
    maxStorageSyncItem: 4092,
    maxTubes: 15,
    update: function (varName, list) {
        var st = this;
        var list = this.removeUnwantedChars(list);
        var localUsage;
        var syncUsage;
        var listSize = this.getListSize(varName.length, list);
        var safeSpace = 2400;
        var storageTypeName = {};
        var objData = {};
        var cuttedList = this.getCuttedList(varName.length, list);

        chrome.storage.local.getBytesInUse(null, function (localBytesInUse) {
            localUsage = localBytesInUse;
            chrome.storage.sync.getBytesInUse(null, function (syncBytesInUse) {
                syncUsage = syncBytesInUse;
                /* additional space needed for parameter like st_wishlist */
                var additionalSize = 4 + varName.length;
                if (localUsage + listSize + additionalSize > st.maxStorageLocal) {
                    console.log('Not enought space in both storages');
                    return;
                } else if (syncUsage + listSize + additionalSize > st.maxStorageSync - safeSpace) {
                    storageTypeName['st_' + varName] = 'l';
                    objData[varName] = list;
                    chrome.storage.local.set(objData);
                } else {
                    storageTypeName['st_' + varName] = 's';
                    var storageVarName;
                    var lastIndex;
                    for (var i in cuttedList) {
                        lastIndex = parseInt(i) + 1;
                        storageVarName = varName + (lastIndex);
                        objData[storageVarName] = cuttedList[i];
                    }
                    chrome.storage.sync.set(objData);

                    /* Remove left parameters */
                    var removeParameters = new Array();
                    for (var i = parseInt(lastIndex + 1); i <= st.maxTubes; i++) {
                        storageVarName = varName + parseInt(i);
                        removeParameters.push(storageVarName);
                    }
                    chrome.storage.sync.remove(removeParameters);
                }
                chrome.storage.sync.set(storageTypeName);
            });
        });
    },
    getListSize: function (varNameLength, list) {
        var length = parseInt(JSON.stringify(list).length + varNameLength);
        var additionalBytes = this.getAdditionalBytes(list)

        return parseInt(length + additionalBytes);
    },
    clear: function (varName) {
        var removeParameters = new Array();
        var storageVarName;

        chrome.storage.sync.remove(varName);

        for (var i = 1; i <= 10; i++) {
            storageVarName = varName + parseInt(i);
            removeParameters.push(storageVarName);
        }
        chrome.storage.sync.remove(removeParameters);
    },
    getCuttedList: function (varNameLength, list) {
        var index = 0;
        var tempIndex = 0;
        var safeItemSpace = 100;
        var cuttedList = new Array();
        var tempList = new Array();
        cuttedList[index] = new Array();

        if (this.getListSize(varNameLength, list) < this.maxStorageSyncItem - safeItemSpace) {
            cuttedList[index] = list;
        } else {
            for (var i in list) {
                tempList[tempIndex] = list[i];
                if (this.getListSize(varNameLength, tempList) > this.maxStorageSyncItem - safeItemSpace) {
                    index++;
                    cuttedList[index] = new Array();
                    tempList = new Array();
                    tempIndex = 0;
                }
                cuttedList[index][tempIndex] = list[i];
                tempIndex++;
            }
        }

        return cuttedList;
    },
    getAdditionalBytes: function (list) {
        var additionalBytes = 0;

        for (var i in list) {
            if (typeof list[i] === 'object') {
                additionalBytes += this.getAdditionalBytes(list[i]);
            } else if (typeof list[i] === 'number' && list[i] % 1 === 0 && list[i] > 2147483647) {
                additionalBytes += 2;
            } else if (typeof list[i] === 'string') {
                if (list[i].match(/®|™/)) {
                    additionalBytes += 1;
                }
            }
        }

        return additionalBytes;
    },
    removeUnwantedChars: function (list) {
        var newArray = new Array();

        if (typeof list === 'object') {
            for (var i in list) {
                newArray[i] = this.removeUnwantedChars(list[i]);
            }
        } else if (typeof list === 'string') {
            return list.replace(/[^A-Za-z0-9 ’:-]/g, '');
        } else {
            return list;
        }

        return newArray;
    }
}

