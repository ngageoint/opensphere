goog.module('plugin.im.action.feature.Entry');
goog.module.declareLegacyNamespace();

const osFeature = goog.require('os.feature');
const FilterActionEntry = goog.require('os.im.action.FilterActionEntry');

const Feature = goog.requireType('ol.Feature');


/**
 * Filter entry that performs actions on matched features.
 *
 * @extends {FilterActionEntry<Feature>}
 */
class Entry extends FilterActionEntry {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setTitle('New Feature Action');
    this.filterGetter = osFeature.filterFnGetter;
  }
}

exports = Entry;
