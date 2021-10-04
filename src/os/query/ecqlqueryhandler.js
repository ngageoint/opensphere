goog.declareModuleId('os.query.ECQLQueryHandler');

import AreaFormatter from '../filter/impl/ecql/areaformatter.js';
import ExclusionFormatter from '../filter/impl/ecql/exclusionformatter.js';
import FilterFormatter from '../filter/impl/ecql/filterformatter.js';
import QueryHandler from './queryhandler.js';


/**
 */
export default class ECQLQueryHandler extends QueryHandler {
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
