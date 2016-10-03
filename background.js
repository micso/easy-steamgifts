function onRequest(request, sender, sendResponse) {
    if (request.action == 'join') {
        chrome.tabs.create({"url": request.href, "active": false}, function (tab) {
            executeJoinScript(tab.id);
        });
    }
    if (request.action == 'removeTab') {
        chrome.tabs.remove(sender.tab.id);
    }
    if (request.action == 'rejoin') {
        request.joinStatus.tryCount++;
        if (request.joinStatus.tryCount <= 3) {
            executeJoinScript(sender.tab.id, request.joinStatus)
        }
    }

    // Return nothing to let the connection be cleaned up.
    sendResponse({});
};

function executeJoinScript(tabId, rewriteStatus) {
    chrome.tabs.executeScript(tabId, {file: 'lib/jquery.min.js', runAt: 'document_end'}, function() {
        var code = 'var rewriteStatus = ' + JSON.stringify(rewriteStatus) + ';'
        chrome.tabs.executeScript(tabId, {code: code, runAt: 'document_end'}, function() {
            chrome.tabs.executeScript(tabId, {file: 'visual.js', runAt: 'document_end'}, function() {
                chrome.tabs.executeScript(tabId, {file: 'join_giveaway.js', runAt: 'document_end'});
            });
        });
    });
}

chrome.extension.onRequest.addListener(onRequest);
