var joinStatus = {comment: false, join: false, tryCount: 1};

if (rewriteStatus) {
    joinStatus = rewriteStatus;
}

var mainTimeout = setTimeout(function () {
    returnStatus();
}, 10000);

$(document).ready(function () {
    joinGiveaway();
});

function joinGiveaway() {
    if (joinStatus.join == false && vis.canJoinGiveaway()) {
        $('.sidebar__entry-insert').click();
        addComment();
        setTimeout(function () {
            checkJoinStatus();
            checkCommentStatus();
            returnStatus();
        }, 3000);
    } else {
        returnStatus();
    }
}

function addComment() {
    if (joinStatus.comment == false) {
        console.log('comment');
        chrome.storage.sync.get(['join_comment'], function (result) {
            var comment = (typeof result.join_comment == 'undefined' ? null : result.join_comment);
            if (comment) {
                var cForm = $('.comment--submit form').last();
                $('textarea[name=description]', cForm).val(comment);
                $.ajax({
                    url: window.location.href,
                    type: 'post',
                    dataType: 'json',
                    data: cForm.serialize()
                })
            } else {
                joinStatus.comment = true;
            }
        });
    }
}

function checkJoinStatus() {
    if (!vis.joinIsLoading() && !vis.canJoinGiveaway()) {
        joinStatus.join = true;
    }
}

function checkCommentStatus() {
    joinStatus.comment = true;
}

function returnStatus() {
    clearTimeout(mainTimeout);
    if (joinStatus.comment && joinStatus.join) {
        chrome.extension.sendRequest({ action: "removeTab" });
    } else {
        chrome.extension.sendRequest({ action: "rejoin", joinStatus: joinStatus });
    }
}
