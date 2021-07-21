goog.module('os.filter.FilterType');
goog.module.declareLegacyNamespace();

const FilterEntry = goog.require('os.filter.FilterEntry');

const IPersistable = goog.requireType('os.IPersistable');


/**
 * Class representing all of the filters that apply to a particular layer type.
 *
 * @implements {IPersistable}
 */
class FilterType {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Array<FilterEntry>}
     */
    this.filters = [];

    /**
     * @type {boolean}
     */
    this.and = true;

    /**
     * @type {boolean}
     */
    this.dirty = false;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    if (!opt_to) {
      opt_to = {};
    }

    var list = [];
    for (var i = 0, n = this.filters.length; i < n; i++) {
      if (!this.filters[i].isTemporary()) {
        list[i] = this.filters[i].persist();
      }
    }

    opt_to['filters'] = list;
    opt_to['and'] = this.and;
    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.and = config['and'];
    var list = config['filters'];

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        var entry = new FilterEntry();
        if (list[i]) {
          entry.restore(list[i]);
          this.filters.push(entry);
        }
      }
    }
  }
}

exports = FilterType;
