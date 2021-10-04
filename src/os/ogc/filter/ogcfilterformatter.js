goog.declareModuleId('os.ogc.filter.OGCFilterFormatter');

const {default: IFilterFormatter} = goog.requireType('os.filter.IFilterFormatter');


/**
 * @implements {IFilterFormatter}
 */
export default class OGCFilterFormatter {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  format(filter) {
    return filter.getFilter() || '';
  }

  /**
   * @inheritDoc
   */
  wrap(filter, group) {
    var g = group ? 'And' : 'Or';
    return '<' + g + '>' + filter + '</' + g + '>';
  }

  /**
   * @inheritDoc
   */
  wrapAll(filter) {
    return filter ? '<And>' + filter + '</And>' : '';
  }
}
