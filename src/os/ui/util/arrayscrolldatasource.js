goog.declareModuleId('os.ui.util.ArrayScrollDataSource');

const Disposable = goog.require('goog.Disposable');


/**
 * angular-ui-utils ng-scroll directive requires a DataSource object to provide data for its infinite scroll capability.
 * This object implements that API using an array as the source.
 *
 * Example: var dataSource = new os.ui.util.ArrayScrollDataSource(myArrayOfItems);
 */
export default class ArrayScrollDataSource extends Disposable {
  /**
   * Constructor.
   * @param {Array} array
   * @param {angular.Scope} scope
   */
  constructor(array, scope) {
    super();

    /**
     * @type {Array}
     * @private
     */
    this.datasource_ = array;

    /**
     * @type {number}
     * @private
     */
    this.revision_ = 0;

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = scope;
  }

  /**
   * @param {Array} array
   */
  setDataSource(array) {
    this.datasource_ = array;
    this.revision_ += 1;
  }

  /**
   * @param {boolean} value
   */
  loading(value) {
    if (this.scope_) {
      this.scope_['dataSourceLoading'] = value;
    }
  }

  /**
   * @param {number} index
   * @param {number} count
   * @param {function(Array)} onSuccess
   */
  get(index, count, onSuccess) {
    var result;
    if (!this.datasource_) {
      result = [];
    } else {
      var offset = 0;
      if (index <= 0) {
        // Checks the indexing to ensure we aren't looking for an element off the top of the datasource array
        // If index is, say, -4, we only want to pull elements 0-5
        offset = index - 1;
        index = 1;
      }
      var start = index - 1;
      var end = Math.min(start + count + offset, this.datasource_.length + 1);
      result = this.datasource_.slice(start, end);
    }
    onSuccess(result);
  }

  /**
   * @return {number}
   */
  revision() {
    return this.revision_;
  }

  /**
   * Update
   */
  update() {
    this.revision_ = this.revision_ += 1;
  }

  /**
   * Cleanup
   */
  disposeInternal() {
    super.disposeInternal();
    this.datasource_ = null;
    this.scope_ = null;
  }
}
