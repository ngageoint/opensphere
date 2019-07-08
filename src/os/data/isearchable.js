goog.provide('os.data.ISearchable');



/**
 * An interface for searchable objects
 *
 * @interface
 */
os.data.ISearchable = function() {};


/**
 * ID for {@see os.implements}.
 * @const {string}
 */
os.data.ISearchable.ID = 'os.data.ISearchable';


/**
 * Returns the text to be used in searches
 * @return {string} The text to search
 */
os.data.ISearchable.prototype.getSearchText;


/**
 * Returns the tags for the item
 * @return {?Array.<!string>} The tags
 */
os.data.ISearchable.prototype.getTags;
