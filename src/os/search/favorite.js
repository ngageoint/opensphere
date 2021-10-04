goog.declareModuleId('os.search.Favorite');

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * Favorite
 * @unrestricted
 */
export default class Favorite {
  /**
   * Constructor.
   * @param {string} name
   * @param {string} uri
   * @param {string} title
   * @param {string=} opt_type
   */
  constructor(name, uri, title, opt_type) {
    this['name'] = name;
    this['type'] = opt_type || 'search';
    this['uri'] = uri;
    this['title'] = title;
  }

  /**
   * Creates a favorite from a bookmark.
   *
   * @param {Object} bookmark
   * @param {string=} opt_type
   * @return {?Favorite}
   */
  static fromBookmark(bookmark, opt_type) {
    if (bookmark) {
      var uri = isEmptyOrWhitespace(makeSafe(bookmark['key'])) ?
        bookmark['key2'] : bookmark['key'];
      return new Favorite(bookmark['value'], uri, uri, opt_type);
    }
    return null;
  }

  /**
   * Helper to just get the URl to favorite
   *
   * @return {string}
   */
  static getFavUrl() {
    var url = window.location.href;
    var index = url.indexOf('?');
    return index > 0 ? url.substring(0, index) : url;
  }
}
