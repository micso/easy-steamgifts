var vis = {
    getPointsElement: function () {
        return $('.nav__points');
    },
    getPoints: function () {
        var element = this.getPointsElement();
        return element.html();
    },
    getUser: function () {
        var name = null;
        $('.nav__right-container a').each(function () {
            var href = $(this).attr('href');
            if (href.match(/user\//) !== null) {
                var res = href.match(/[^/]+$/);
                name = res[0];
            }
        });

        return name;
    },
    addNews: function (message) {
        $('.sidebar').next('div').prepend('<div id="esg-news">' + message + '</div>');
    },
    getGiveawayList: function (html) {
        return $('.giveaway__row-outer-wrap', html);
    },
    getGiveawaysData: function (html) {
        var vis = this;
        var list = new Array();
        var item = null;
        this.getGiveawayList(html).each(function () {
            item = vis.getGiveawayData($(this));
            if (item !== null) list.push(item);
        });
        return list;
    },
    getGiveawayData: function (item) {
        var enableIncrement = true;
        var image = $('a.giveaway_image_thumbnail,.giveaway_image_thumbnail_missing', item);
        if (image.length == 0) image = null;
        // What does this do?
        //else image.attr('style').replace('background-image:url(', '').replace(');', '');

        if ($('.giveaway__heading > a.giveaway__icon', item).length) {
            var appId = parseInt($('.giveaway__heading > a.giveaway__icon', item).attr('href').match(/app\/[0-9]+|sub\/[0-9]+/)[0].replace('app/', '').replace('sub/', ''));
        } else {
            var appId = null;
        }

        var joined = $('> .giveaway__row-inner-wrap', item).hasClass('is-faded');
        var contributor = {active: false, value: null, achievable: true};
        var contrubutorElement = $('.giveaway__columns .giveaway__column--contributor-level', item);
        if (contrubutorElement[0]) {
            contributor.active = true;
            contributor.value = parseInt(contrubutorElement.text().match(/[0-9]+/)[0]);
            if (contrubutorElement.hasClass('giveaway__column--contributor-level--negative')) {
                contributor.achievable = false;
            }
        }
        var name = $('a.giveaway__heading__name', item).text();
        var href = $('a.giveaway__heading__name', item).attr('href');
        var timeRemaining = this.stringToTime($('i.fa-clock-o', item).next('span').text());
        if (timeRemaining <= 1) enableIncrement = false;
        var created = this.stringToTime($('a.giveaway__username', item).prev('span').text());
        var entries = parseInt($('.giveaway__links > a span', item).text().replace(',', '').match(/[0-9]+/)[0]);
        var copies = 1;
        var points = null;
        $('.giveaway__heading .giveaway__heading__thin', item).each(function () {
            if ($(this).text().match(/\([0-9]+ Copies\)/)) {
                copies = parseInt($(this).text().match(/[0-9]+/)[0]);
            } else if ($(this).text().match(/\([0-9]+P\)/)) {
                points = parseInt($(this).text().match(/[0-9]+/)[0]);
            }
        });
        var entriesIncrement = (enableIncrement ? ((entries / created) * timeRemaining) : 0);
        var chance = ((1 / (entries + entriesIncrement + 1)) * 100) * copies;

        return {
            contributor: contributor,
            name: name,
            href: href,
            timeRemaining: timeRemaining,
            created: created,
            entries: entries,
            copies: copies,
            image: image,
            points: points,
            appId: appId,
            chance: chance,
            joined: joined
        };
    },
    stringToTime: function (text) {
        if (/seconds/.exec(text)) {
            var timeConverter = 1 / 60;
        } else if (/minute/.exec(text) || /minutes/.exec(text)) {
            var timeConverter = 1;
        } else if (/hour/.exec(text) || /hours/.exec(text)) {
            var timeConverter = 60;
        } else if (/day/.exec(text) || /days/.exec(text)) {
            var timeConverter = 1440;
        } else {
            var timeConverter = 10080;
        }
        return parseInt(text.match(/[0-9]+/)) * timeConverter;
    },
    updateGiveawayListPage: function () {
        var vis = this;
        var giveaway;
        var searchResult;
        this.getGiveawayList().each(function () {
            if (!$(this).hasClass('esg')) {
                giveaway = vis.getGiveawayData($(this));
                if (giveaway !== null) {
                    $('.giveaway__columns', this).prepend('<a href="javascript:void(0);" class="esg-bl-link"><div><i class="fa fa-plus-square"/> <span>eSG Blacklist</span></div></a>');
                    $('.giveaway__columns', this).prepend('<div class="esg-win-chance">' + giveaway.chance.toFixed(3) + '%</div>');
                    if (!giveaway.joined && giveaway.contributor.achievable && sg.points >= giveaway.points) {
                        $('.giveaway_image_thumbnail,.giveaway_image_thumbnail_missing', this).prepend('<div class="esg-join"><a href="javascript:void(0);" points="' + giveaway.points + '" joinHref="' + giveaway.href + '">Join</a></div>');
                    }

                    if (sg.storage.hideDlc == true) {
                        searchResult = sg.findLocalGame(giveaway.appId);
                        if (searchResult.result == true) {
                            if (sg.games[searchResult.i].data.isDlc == true) {
                                $(this).hide();
                            }
                        }
                    }
                    if (sg.storage.hideHighLevel == true && giveaway.contributor.active && giveaway.contributor.achievable == false) {
                        $(this).hide();
                    }
                    if (sg.storage.filterPointsSymbol == 1 && sg.storage.filterPoints >= giveaway.points) {
                        $(this).hide();
                    } else if (sg.storage.filterPointsSymbol == 2 && sg.storage.filterPoints < giveaway.points) {
                        $(this).hide();
                    }
                    if (sg.storage.filterPercentage > giveaway.chance.toFixed(3)) {
                      $(this).hide();
                    }
                    if (sg.findWishlistGame(giveaway.appId).result == true && vis.getUrlParameter('type') != 'wishlist') {
                        $(this).addClass('esg-on-wishlist');
                    }
                    if (sg.findBlacklistGame(giveaway.appId).result == true) {
                        vis.setGiveawayBl($('.esg-bl > a', $(this)));
                        if (sg.storage.hideBlacklist == true) {
                            $(this).hide();
                        }
                    }
                    $(this).addClass('esg');
                }
            }
        });
    },
    setGiveawayJoined: function (joinButton) {
        vis = this;
        var item = joinButton.parents('.giveaway__row-outer-wrap');
        item.children('.giveaway__row-inner-wrap').addClass('is-faded');
        joinButton.fadeOut();

        var giveaway = vis.getGiveawayData(item[0]);
        sg.pointsLeft = sg.pointsLeft - giveaway.points;
        this.getPointsElement().html(sg.pointsLeft);

        this.getGiveawayList().each(function () {
            giveaway = vis.getGiveawayData($(this));
            if (giveaway !== null && giveaway.points > sg.pointsLeft) {
                $('.esg-join', $(this)).fadeOut();
            }
        });
    },
    setGiveawayBl: function (blButton) {
        vis = this;
        var item = blButton.parents('.giveaway__row-outer-wrap');
        var innerWrap = item.children('.giveaway__row-inner-wrap');
        if (innerWrap.hasClass('bl')) {
            innerWrap.removeClass('bl');
            $('i', blButton).removeClass('fa-minus-square').addClass('fa-plus-square');
        } else {
            innerWrap.addClass('bl');
            $('i', blButton).removeClass('fa-plus-square').addClass('fa-minus-square');
        }

        var giveaway = vis.getGiveawayData(item[0]);
        return {appId: giveaway.appId, name: giveaway.name};
    },
    getSteamId: function () {
        var steamId = $('div.sidebar > div.sidebar__shortcut-outer-wrap > div.sidebar__shortcut-inner-wrap > a').attr('href').match(/[^/]+$/);
        if (steamId !== null) {
            return steamId[0];
        } else {
            return null;
        }
    },
    moveDiscussionToTop: function () {
        var discussionElement = $('.widget-container a[href="/discussions"]').closest('.widget-container').attr('style', 'margin-bottom: 20px;');
        $('.sidebar').next('div').prepend(discussionElement.prop('outerHTML'));
        discussionElement.hide();
    },
    addPageLoaderInfo: function () {
        $('.giveaway__row-outer-wrap').last().after('<div id="new-page-loader" style="display: none;"><img src="' + chrome.extension.getURL("/img/ajax-loader.gif") + '"/><br/><span>Loading next page</span></div><div id="page-load-line"></div>');
    },
    getCurrentPage: function () {
        var page = this.getUrlParameter('page');
        return typeof page == 'undefined' ? 1 : parseInt(page);
    },
    getUrlParameter: function (sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    },
    showPageLoaderInfo: function () {
        $('#new-page-loader').show();
    },
    hidePageLoaderInfo: function () {
        $('#new-page-loader').hide();
    },
    updateCommentForm: function (textarea) {
        var patterns = new Array();
        patterns['a'] = {pat: '[%SEL_TEXT%](URL_HERE)', name: 'LINK'};
        patterns['b'] = {pat: '**%SEL_TEXT%**', name: 'B'};
        patterns['i'] = {pat: '_%SEL_TEXT%_', name: 'I'};
        patterns['c'] = {pat: '`%SEL_TEXT%`', name: 'CODE'};
        patterns['h1'] = {pat: '# %SEL_TEXT%', name: 'H1'};
        patterns['h2'] = {pat: '## %SEL_TEXT%', name: 'H2'};
        patterns['h3'] = {pat: '#### %SEL_TEXT%', name: 'H3'};
        patterns['h4'] = {pat: '##### %SEL_TEXT%', name: 'H4'};
        patterns['h5'] = {pat: '###### %SEL_TEXT%', name: 'H5'};
        patterns['l'] = {pat: '%SEL_TEXT%\n\n---\n\n', name: 'LINE'};

        var buttons = '<span><a href="http://steamcommunity.com/groups/easysg">eSG</a> Toolbar: </span>';
        for (var i in patterns) {
            buttons += '<button type="button" class="esg-comment" value="' + i + '">' + patterns[i].name + '</button>';
        }

        textarea.before(buttons);

        $('.esg-comment').click(function () {
            var type = $(this).val();
            var pattern = patterns[type].pat;
            var selectedText = textarea.textrange().text;
            if (type != 'l' && selectedText == '') {
                selectedText = 'TEXT';
            }
            var position = textarea.textrange().position;
            var replacedText = pattern.replace('%SEL_TEXT%', selectedText);
            textarea.textrange('replace', replacedText);
            textarea.textrange('setcursor', position + replacedText.length);
        });
    },
    updateDonators: function () {
        var star = '<img src="' + chrome.extension.getURL("/img/star.gif") + '"/>';
        var title = 'Easy Steam Gifts Donator';
        $('.giveaway__username').each(function () {
            var username = $(this).html();
            if (sg.isDonator(username)) {
                $(this).addClass('esg-donator').html(star + ' ' + username + ' ' + star).attr('title', title);
            }
        });
        $('.comment__username > a').each(function () {
            var username = $(this).html();
            if (sg.isDonator(username)) {
                $(this).addClass('esg-donator').html(star + ' ' + username + ' ' + star).attr('title', title);
            }
        });
    },
    canJoinGiveaway: function () {
        if ($('.sidebar__entry-delete').hasClass('is-hidden')) {
            return true;
        } else {
            return false;
        }
    },
    joinIsLoading: function () {
        if ($('.sidebar__entry-loading').hasClass('is-hidden')) {
            return false;
        } else {
            return true;
        }
    },
    enableStickyHeader: function () {
        $('header').css({ "position": "fixed", "width": "100%", "z-index": "9999" });
        $('.featured__container').css({"padding-top": "39px"});
    }
}
