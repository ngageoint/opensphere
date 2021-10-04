goog.declareModuleId('os.data.ISearchable');

/**
 * An interface for searchable objects
 *
 * @interface
 */
export default class ISearchable {
  /**
   * Returns the text to be used in searches
   * @return {string} The text to search
   */
  getSearchText() {}

  /**
   * Returns the tags for the item
   * @return {?Array.<!string>} The tags
   */
  getTags() {}
}


/**
 * ID for {@see os.implements}.
 * @const {string}
 */
ISearchable.ID = 'os.data.ISearchable';
