goog.module('os.ui.slick.LoadingNode');

const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Tree node implementing loading behavior.
 */
class LoadingNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {boolean}
     * @private
     */
    this.loading_ = false;
  }

  /**
   * Whether or not the node is loading
   *
   * @return {boolean}
   * @export
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * Set whether or not the node is loading
   *
   * @param {boolean} value
   * @export
   */
  setLoading(value) {
    if (value != this.loading_) {
      this.loading_ = value;
      this.dispatchEvent(new PropertyChangeEvent('loading', value, !value));
    }
  }

  /**
   * @inheritDoc
   */
  getCheckboxDisabled() {
    return this.isLoading() || null;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    var node = /** @type {LoadingNode} */ (other);
    this.setLoading(node.isLoading());
    super.updateFrom(other);
  }
}

exports = LoadingNode;
