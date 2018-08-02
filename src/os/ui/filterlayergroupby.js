goog.provide('os.ui.FilterLayerGroupBy');
goog.require('os.ui.filter.ui.FilterGroupBy');
// goog.require('os.layer.Vector');



/**
 * Groups nodes by type
 * @param {boolean=} opt_type
 * @extends {os.ui.filter.ui.FilterGroupBy}
 * @constructor
 */
os.ui.FilterLayerGroupBy = function(opt_type) {
  os.ui.FilterLayerGroupBy.base(this, 'constructor');

  /**
   * @type {boolean | undefined}
   * @private
   */
  this.useType_ = opt_type;
};
goog.inherits(os.ui.FilterLayerGroupBy, os.ui.filter.ui.FilterGroupBy);


/**
 * @inheritDoc
 */
os.ui.FilterLayerGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  /**
   * @type {?string}
   */
  var type = /** @type {os.ui.filter.ui.FilterNode} */ (node).getEntry().type;
  var val = 'Unknown';

  if (type) {
    var filterable = os.ui.filterManager.getFilterable(type);
    if (filterable instanceof os.layer.Vector) {
      val = filterable.getTitle();
      if (this.useType_) {
        val += ' ' + filterable.getExplicitType();
      }
      var provider = filterable.getProvider();
      if (provider) {
        val += ' (' + provider + ')';
      }
    } else {
      val = os.ui.filter.FilterManager.prettyPrintType(type, this.useType_) + ' (not loaded)';
    }
  }

  goog.array.insert(ids, val);
  return ids;
};
