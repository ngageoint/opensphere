goog.module('os.filter.impl.ecql.ExclusionFormatter');
goog.module.declareLegacyNamespace();

const AreaFormatter = goog.require('os.filter.impl.ecql.AreaFormatter');


/**
 */
class ExclusionFormatter extends AreaFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column Optional geometry column name
   */
  constructor(opt_column) {
    super(opt_column);
    this.spatialPredicate = 'DISJOINT';
    this.group = 'AND';
  }
}

exports = ExclusionFormatter;
