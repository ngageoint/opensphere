goog.declareModuleId('os.ui.filter.op.LessThan');

import {quoteString} from '../filterstring.js';
import Op from './op.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * A 'PropertyIsLessThan' operation class.
 */
export default class LessThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsLessThan', 'is less than', '<');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '<' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}
