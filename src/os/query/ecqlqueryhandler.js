goog.module('os.query.ECQLQueryHandler');
goog.module.declareLegacyNamespace();

const AreaFormatter = goog.require('os.filter.impl.ecql.AreaFormatter');
const ExclusionFormatter = goog.require('os.filter.impl.ecql.ExclusionFormatter');
const FilterFormatter = goog.require('os.filter.impl.ecql.FilterFormatter');
const QueryHandler = goog.require('os.query.QueryHandler');


/**
 */
class ECQLQueryHandler extends QueryHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setAreaFormatter(new AreaFormatter());
    this.setExclusionFormatter(new ExclusionFormatter());
    this.setFilterFormatter(new FilterFormatter());
    this.spatialRequired = true;
  }

  /**
   * @inheritDoc
   */
  createFilter() {
    var filter = super.createFilter();
    // see FilterFormatter.writeLiteral_() for why this is necessary
    filter = filter.replace(/{openParen}/g, '(').replace(/{closeParen}/g, ')');
    return filter;
  }
}

exports = ECQLQueryHandler;
