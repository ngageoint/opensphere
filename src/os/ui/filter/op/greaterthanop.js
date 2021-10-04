goog.declareModuleId('os.ui.filter.op.GreaterThan');

import {quoteString} from '../filterstring.js';
import Op from './op.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * A 'PropertyIsGreaterThan' operation class.
 */
export default class GreaterThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsGreaterThan', 'is greater than', '>');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '>' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}
