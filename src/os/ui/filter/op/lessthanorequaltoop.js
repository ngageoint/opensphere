goog.declareModuleId('os.ui.filter.op.LessThanOrEqualTo');

import {quoteString} from '../filterstring.js';
import Op from './op.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * A 'PropertyIsLessThanOrEqualTo' operation class.
 */
export default class LessThanOrEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsLessThanOrEqualTo', 'is less than or equal to', '<=');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '<=' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}
