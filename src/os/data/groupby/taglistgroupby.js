goog.provide('os.data.groupby.TagListGroupBy');
goog.require('goog.array');
goog.require('os.config.Settings');
goog.require('os.ui.data.groupby.TagGroupBy');



/**
 * Groups nodes by a given list of tags
 * @extends {os.ui.data.groupby.TagGroupBy}
 * @param {boolean=} opt_open Keeps groups open by default
 * @constructor
 */
os.data.groupby.TagListGroupBy = function(opt_open) {
  os.data.groupby.TagListGroupBy.base(this, 'constructor', opt_open);

  /**
   * @type {Array.<!string>}
   * @private
   */
  this.list_ = null;
};
goog.inherits(os.data.groupby.TagListGroupBy, os.ui.data.groupby.TagGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.TagListGroupBy.prototype.init = function() {
  os.data.groupby.TagListGroupBy.superClass_.init.call(this);
  this.list_ = /** @type {?Array.<string>} */ (os.settings.get(['tagList']));

  if (this.list_) {
    for (var i = 0, n = this.list_.length; i < n; i++) {
      this.list_[i] = this.list_[i].toUpperCase();
    }
  }
};


/**
 * @inheritDoc
 */
os.data.groupby.TagListGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<string>}
   */
  var ids = [];
  var tags = null;

  try {
    tags = /** @type {os.data.ISearchable} */ (node).getTags();

    if (!tags) {
      // try the parent
      tags = /** @type {os.data.ISearchable} */ (node.getParent()).getTags();
    }
  } catch (e) {
  }

  if (tags && this.list_) {
    for (var i = 0, n = tags.length; i < n; i++) {
      var t = tags[i].toUpperCase();

      if (this.list_.indexOf(t) > -1) {
        goog.array.insert(ids, 'a' + t);
      }
    }
  }

  if (ids.length === 0) {
    ids.push('zNot Specified');
  }

  return ids;
};
