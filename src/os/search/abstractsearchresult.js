goog.module('os.search.AbstractSearchResult');
goog.module.declareLegacyNamespace();

const ISearchResult = goog.requireType('os.search.ISearchResult');


/**
 * Base class for a search result.
 *
 * @abstract
 * @implements {ISearchResult<T>}
 * @template T
 */
class AbstractSearchResult {
  /**
   * Constructor.
   * @param {T} result The result.
   * @param {number=} opt_score The result's score.
   * @param {number|string=} opt_id The result's id.
   */
  constructor(result, opt_score, opt_id) {
    // allow truthy values or explicit 0, not an empty string
    /**
     * The result id.
     * @type {number|string}
     * @private
     */
    this.id_ = opt_id || opt_id === 0 ? opt_id : AbstractSearchResult.nextId_++;

    /**
     * The result.
     * @type {T}
     * @protected
     */
    this.result = result;

    /**
     * The result score.
     * @type {number}
     * @protected
     */
    this.score = opt_score || 0;
  }

  /**
   * @inheritDoc
   * @final
   * @export
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  getResult() {
    return this.result;
  }

  /**
   * @inheritDoc
   */
  setResult(value) {
    this.result = value;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return this.score;
  }

  /**
   * @inheritDoc
   */
  setScore(value) {
    this.score = value;
  }

  /**
   * @inheritDoc
   */
  performAction() {
    // default to no action
    return false;
  }
}

/**
 * Incrementing counter for results that do not specify an id.
 * @type {number}
 * @private
 */
AbstractSearchResult.nextId_ = 0;

exports = AbstractSearchResult;
