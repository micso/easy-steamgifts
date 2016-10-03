getWishlist();

function getWishlist() {
    var wishlist = new Array();

    $("#wishlist_items > div.wishlistRow").each(function () {
        var appId = parseInt($(this).attr('id').match(/[0-9]+/)[0]);
        var appName = $('.wishlistRowItem > h4', this).text();
        var index = wishlist.length;
        if(appId && appName) {
            wishlist[index] = new Array();
            wishlist[index][0] = appId;
            wishlist[index][1] = appName;
        }

    });

    st.update('wishlist', wishlist);
}