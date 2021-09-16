goog.module('os.ogc.filter.OGCFilterFormatter');

const IFilterFormatter = goog.requireType('os.filter.IFilterFormatter');


/**
 * @implements {IFilterFormatter}
 */
class OGCFilterFormatter {
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

exports = OGCFilterFormatter;
