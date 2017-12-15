goog.provide('os.data.groupby.RecentGroupBy');

goog.require('goog.array');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups nodes by how recently they have been activated
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.RecentGroupBy = function() {
  os.data.groupby.RecentGroupBy.base(this, 'constructor');

  /**
   * @type {?Array.<{label: string, time: number}>}
   * @private
   */
  this.times_ = [];

  /**
   * @type {?Date}
   * @private
   */
  this.testDate_ = null;
};
goog.inherits(os.data.groupby.RecentGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.RecentGroupBy.prototype.init = function() {
  os.data.groupby.RecentGroupBy.superClass_.init.call(this);
  this.times_.length = 0;

  var d = this.testDate_ || new Date();
  d.setHours(0, 0, 0, 0);

  this.times_.push({label: 'Today', time: d.getTime()});
  this.times_.push({label: 'Yesterday', time: d.getTime() - 24 * 60 * 60 * 1000});

  d.setDate(d.getDate() - d.getDay());
  this.times_.push({label: 'This Week', time: d.getTime()});

  d.setDate(d.getDate() - 7);
  this.times_.push({label: 'Last Week', time: d.getTime()});

  d.setDate(d.getDate() - 7);
  this.times_.push({label: '2 Weeks Ago', time: d.getTime()});
};


/**
 * @inheritDoc
 */
os.data.groupby.RecentGroupBy.prototype.disposeInternal = function() {
  this.times_.length = 0;
  os.data.groupby.RecentGroupBy.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.data.groupby.RecentGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<string>}
   */
  var ids = [];

  /** @type {os.data.IDataDescriptor} */
  var d = null;

  if (node instanceof os.ui.data.DescriptorNode) {
    d = /** @type {os.ui.data.DescriptorNode} */ (node).getDescriptor();
  }

  if (d) {
    for (var i = 0, n = this.times_.length; i < n; i++) {
      var t = d.getLastActive();
      if (!isNaN(t) && t >= this.times_[i].time) {
        goog.array.insert(ids, i + this.times_[i].label);
        return ids;
      }
    }
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.RecentGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id.substring(1));
  group.setCheckboxVisible(false);
  group.setToolTip('All layers activated ' + group.getLabel().toLowerCase());
  return group;
};
