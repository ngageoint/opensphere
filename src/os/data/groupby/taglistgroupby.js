goog.module('os.data.groupby.TagListGroupBy');
goog.module.declareLegacyNamespace();

const googArray = goog.require('goog.array');
const Settings = goog.require('os.config.Settings');
const TagGroupBy = goog.require('os.ui.data.groupby.TagGroupBy');


/**
 * Groups nodes by a given list of tags
 */
class TagListGroupBy extends TagGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_open Keeps groups open by default
   */
  constructor(opt_open) {
    super(opt_open);

    /**
     * @type {Array.<!string>}
     * @private
     */
    this.list_ = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();
    this.list_ = /** @type {?Array.<string>} */ (Settings.getInstance().get(['tagList']));

    if (this.list_) {
      for (var i = 0, n = this.list_.length; i < n; i++) {
        this.list_[i] = this.list_[i] && this.list_[i].toUpperCase();
      }
    }
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
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
      var invalid = false;
      for (var i = 0, n = tags.length; i < n; i++) {
        if (tags[i]) {
          var t = tags[i].toUpperCase();
          if (this.list_.indexOf(t) > -1) {
            googArray.insert(ids, 'a' + t);
          }
        } else {
          invalid = true;
        }
      }
      if (invalid) {
        goog.log.fine(this.log, 'Invalid tag set for ' + node.getLabel() + ': \n' + JSON.stringify(tags));
      }
    }

    if (ids.length === 0) {
      ids.push('zNot Specified');
    }

    return ids;
  }
}

exports = TagListGroupBy;
