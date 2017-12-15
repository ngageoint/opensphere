goog.provide('os.data.groupby.SourceGroupBy');

goog.require('goog.array');
goog.require('os.data.RecordField');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.query');
goog.require('os.ui.slick.SlickTreeNode');


// this field is used to track areas by source
goog.array.insert(os.ui.query.featureKeys, os.data.RecordField.SOURCE_NAME);



/**
 * Groups nodes by their source when available.
 * @param {boolean=} opt_open Keeps groups open by default
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.SourceGroupBy = function(opt_open) {
  os.data.groupby.SourceGroupBy.base(this, 'constructor');

  /**
   * @type {boolean}
   * @private
   */
  this.open_ = opt_open || false;
};
goog.inherits(os.data.groupby.SourceGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.SourceGroupBy.prototype.getGroupIds = function(node) {
  var ids = /** @type {Array<string>} */ ([]);
  var sourceName;

  if (node && node instanceof os.ui.query.AreaNode) {
    try {
      sourceName = /** @type {string|undefined} */ (node.getArea().get(os.data.RecordField.SOURCE_NAME));
    } catch (e) {
      // can't find the source, so use the default group
    }
  }

  if (sourceName) {
    ids.push(sourceName);
  } else {
    ids.push('No Associated Source');
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.SourceGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  group.collapsed = !this.open_;
  return group;
};
