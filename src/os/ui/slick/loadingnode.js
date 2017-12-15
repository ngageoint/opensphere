goog.provide('os.ui.slick.LoadingNode');

goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree node implementing loading behavior.
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.slick.LoadingNode = function() {
  os.ui.slick.LoadingNode.base(this, 'constructor');

  /**
   * @type {boolean}
   * @private
   */
  this.loading_ = false;
};
goog.inherits(os.ui.slick.LoadingNode, os.ui.slick.SlickTreeNode);


/**
 * Whether or not the node is loading
 * @return {boolean}
 */
os.ui.slick.LoadingNode.prototype.isLoading = function() {
  return this.loading_;
};
goog.exportProperty(
    os.ui.slick.LoadingNode.prototype,
    'isLoading',
    os.ui.slick.LoadingNode.prototype.isLoading);


/**
 * Set whether or not the node is loading
 * @param {boolean} value
 */
os.ui.slick.LoadingNode.prototype.setLoading = function(value) {
  if (value != this.loading_) {
    this.loading_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', value, !value));
  }
};
goog.exportProperty(
    os.ui.slick.LoadingNode.prototype,
    'setLoading',
    os.ui.slick.LoadingNode.prototype.setLoading);


/**
 * @inheritDoc
 */
os.ui.slick.LoadingNode.prototype.getCheckboxDisabled = function() {
  return this.isLoading();
};


/**
 * @inheritDoc
 */
os.ui.slick.LoadingNode.prototype.updateFrom = function(other) {
  var node = /** @type {os.ui.slick.LoadingNode} */ (other);
  this.setLoading(node.isLoading());
  os.ui.slick.LoadingNode.base(this, 'updateFrom', other);
};
