goog.declareModuleId('os.ui.filter.op.Rule');

import Op from './op.js';
const DataType = goog.require('os.xsd.DataType');


/**
 */
export default class Rule extends Op {
  /**
   * Constructor.
   * @param {string} localName
   * @param {string} title
   * @param {string=} opt_shortTitle
   * @param {?Array.<string>=} opt_supportedTypes
   * @param {string=} opt_attrs
   * @param {string=} opt_hint
   * @param {string=} opt_ui
   */
  constructor(localName, title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui) {
    super(localName, title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui);

    this.supportedTypes = [DataType.INTEGER];
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    if (literal) {
      return '<And><' + this.localName + ' property="getNumberOfResults" value="' + literal + '">' +
          '</' + this.localName + '></And>';
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getLiteral(el) {
    return el.attr('value');
  }
}
