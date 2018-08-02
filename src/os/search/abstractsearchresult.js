goog.provide('os.search.AbstractSearchResult');
goog.require('os.search.ISearchResult');



/**
 * Base class for a search result.
 * @param {T} result The result.
 * @param {number=} opt_score The result's score.
 * @param {number|string=} opt_id The result's id.
 * @implements {os.search.ISearchResult.<T>}
 * @constructor
 * @template T
 */
os.search.AbstractSearchResult = function(result, opt_score, opt_id) {
  os.search.AbstractSearchResult.nextId_++;

  /**
   * @type {number|string}
   * @private
   */
  this.id_ = opt_id || os.search.AbstractSearchResult.nextId_;

  /**
   * @type {T}
   * @protected
   */
  this.result = result;

  /**
   * @type {number}
   * @protected
   */
  this.score = opt_score || 0;
};


/**
 * @type {number}
 * @private
 */
os.search.AbstractSearchResult.nextId_ = 0;


/**
 * @inheritDoc
 * @final
 */
os.search.AbstractSearchResult.prototype.getId = function() {
  return this.id_;
};
goog.exportProperty(
    os.search.AbstractSearchResult.prototype,
    'getId',
    os.search.AbstractSearchResult.prototype.getId);


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.getResult = function() {
  return this.result;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.setResult = function(value) {
  this.result = value;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.getScore = function() {
  return this.score;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.setScore = function(value) {
  this.score = value;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.getSearchUI = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.setSearchUI = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.search.AbstractSearchResult.prototype.performAction = function() {
  // default to no action
  return false;
};
