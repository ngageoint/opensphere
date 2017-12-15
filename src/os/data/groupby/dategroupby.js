goog.provide('os.data.groupby.DateGroupBy');

goog.require('goog.array');
goog.require('goog.string');
goog.require('os.data.DataManager');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups nodes by their max date
 * @extends {os.data.groupby.BaseGroupBy}
 * @param {boolean=} opt_open Whether or not to keep the category open by default
 * @constructor
 */
os.data.groupby.DateGroupBy = function(opt_open) {
  os.data.groupby.DateGroupBy.base(this, 'constructor');

  /**
   * @type {number}
   * @private
   */
  this.now_ = NaN;

  /**
   * @type {boolean}
   * @private
   */
  this.open_ = opt_open || false;
};
goog.inherits(os.data.groupby.DateGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @type {!Array.<{label: string, offset: number}>}
 * @const
 * @private
 */
os.data.groupby.DateGroupBy.PERIODS_ = [{
  label: 'Last Minute',
  offset: 60 * 1000
}, {
  label: 'Last 5 Minutes',
  offset: 5 * 60 * 1000
}, {
  label: 'Last 15 Minutes',
  offset: 15 * 60 * 1000
}, {
  label: 'Last 30 Minutes',
  offset: 30 * 60 * 1000
}, {
  label: 'Last Hour',
  offset: 60 * 60 * 1000
}, {
  label: 'Last 3 Hours',
  offset: 3 * 60 * 60 * 1000
}, {
  label: 'Last 6 Hours',
  offset: 6 * 60 * 60 * 1000
}, {
  label: 'Last 12 Hours',
  offset: 12 * 60 * 60 * 1000
}, {
  label: 'Last 24 Hours',
  offset: 24 * 60 * 60 * 1000
}, {
  label: 'Last 48 Hours',
  offset: 48 * 60 * 60 * 1000
}, {
  label: 'Last 7 Days',
  offset: 7 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 2 Weeks',
  offset: 14 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 30 Days',
  offset: 30 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 60 Days',
  offset: 60 * 24 * 60 * 60 * 1000
}];


/**
 * @inheritDoc
 */
os.data.groupby.DateGroupBy.prototype.init = function() {
  os.data.groupby.DateGroupBy.superClass_.init.call(this);
  this.now_ = goog.now();
};


/**
 * @inheritDoc
 */
os.data.groupby.DateGroupBy.prototype.getGroupIds = function(node) {
  /** @type {Array.<string>} */
  var ids = [];

  var max = Number.NEGATIVE_INFINITY;

  /** @type {os.data.IDataDescriptor} */
  var d = null;

  if (node instanceof os.ui.data.DescriptorNode) {
    d = /** @type {os.ui.data.DescriptorNode} */ (node).getDescriptor();
  } else {
    var dm = os.dataManager;
    d = dm.getDescriptor(node.getId());
  }

  if (d) {
    max = d.getMaxDate();
  }

  if (!isNaN(max) && max > Number.NEGATIVE_INFINITY) {
    if (max > this.now_) {
      goog.array.insert(ids, 'xxReports future activity');
      return ids;
    }

    var p = os.data.groupby.DateGroupBy.PERIODS_;
    for (var i = 0, n = p.length; i < n; i++) {
      if ((this.now_ - p[i].offset) <= max) {
        goog.array.insert(ids, goog.string.padNumber(i, 2) + p[i].label);
        return ids;
      }
    }

    goog.array.insert(ids, 'yyNo recent activity');
    return ids;
  }

  goog.array.insert(ids, 'zzCould not determine activity');
  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.DateGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id.substring(2));
  group.setCheckboxVisible(false);

  if (id.indexOf('Last') > -1) {
    group.setToolTip('Contains all results that report activity over the ' + group.getLabel().toLowerCase() + '.');
  } else if (id.indexOf('zz') > -1) {
    group.setToolTip('Contains all results for which the activity could not be determined.');
  } else if (id.indexOf('yy') > -1) {
    group.setToolTip('Contains all results that do not have any recent activity.');
  } else if (id.indexOf('xx') > -1) {
    group.setToolTip('Contains all results that report future activity and thus cannot be accurately binned in' +
        'the other groups');
  }

  group.collapsed = !this.open_;

  return group;
};
