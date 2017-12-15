goog.provide('os.search.Favorite');
goog.require('goog.string');
goog.require('os.search.SearchEventType');



/**
 * Favorite
 * @param {string} name
 * @param {string} uri
 * @param {string} title
 * @param {string=} opt_type
 * @constructor
 */
os.search.Favorite = function(name, uri, title, opt_type) {
  this['name'] = name;
  this['type'] = opt_type || 'search';
  this['uri'] = uri;
  this['title'] = title;
};


/**
 * Creates a favorite from a bookmark.
 * @param {Object} bookmark
 * @param {string=} opt_type
 * @return {?os.search.Favorite}
 */
os.search.Favorite.fromBookmark = function(bookmark, opt_type) {
  if (bookmark) {
    var uri = goog.string.isEmptySafe(bookmark['key']) ? bookmark['key2'] : bookmark['key'];
    return new os.search.Favorite(bookmark['value'], uri, uri, opt_type);
  }
  return null;
};


/**
 * Helper to just get the URl to favorite
 * @return {string}
 */
os.search.Favorite.getFavUrl = function() {
  var url = window.location.href;
  var index = url.indexOf('?');
  return index > 0 ? url.substring(0, index) : url;
};
