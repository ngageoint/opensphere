goog.provide('os.ui.filter.ui.FilterGroupBy');
goog.require('goog.array');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.filter.ui.filterGroupUIDirective');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups nodes by type
 * @param {boolean=} opt_useUi
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.ui.filter.ui.FilterGroupBy = function(opt_useUi) {
  os.ui.filter.ui.FilterGroupBy.base(this, 'constructor');

  /**
   * Whether this groupby will use the filtergroupui
   * @type {boolean}
   * @private
   */
  this.useUi_ = opt_useUi || false;
};
goog.inherits(os.ui.filter.ui.FilterGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  /**
   * @type {?string}
   */
  var val = /** @type {os.ui.filter.ui.FilterNode} */ (node).getEntry().type;

  if (!val) {
    val = 'Unknown';
  } else {
    try {
      var firstHashIdx = val.indexOf('#');
      if (firstHashIdx != -1) {
        val = val.substring(firstHashIdx + 1);
        var secHashIdx = val.indexOf('#');
        if (secHashIdx != -1) {
          val = val.substring(0, secHashIdx);
        }
      }
    } catch (e) {
      // weirdly structured typename
    }
  }

  goog.array.insert(ids, val);
  return ids;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  group.collapsed = false;
  if (this.useUi_) {
    group.setNodeUI('<filtergroupui></filtergroupui>');
  }

  var dm = os.dataManager;
  var d = dm.getDescriptor(id);

  if (d) {
    group.setLabel(d.getTitle() + ' (' + d.getProvider() + ')');
  }

  return group;
};
