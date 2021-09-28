goog.declareModuleId('os.ui.filter.op.IsLike');

import DataType from '../../../xsd.js';
import {escapeRegExp} from '../filterstring.js';
import Op from './op.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * A 'PropertyIsLike' operation class.
 */
export default class IsLike extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'PropertyIsLike',
        'is like',
        'like',
        [DataType.STRING],
        'wildCard="*" singleChar="." escape="\\"',
        'e.g. abc*' + Op.TEXT.CASE_INSENSITIVE,
        undefined,
        undefined,
        Op.TEXT.CASE_INSENSITIVE_TITLE,
        Op.TEXT.CASE_INSENSITIVE_DETAIL
    );
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      // make the string safe for use in a RegExp
      var reStr = escapeRegExp(literal);

      // test the expression, case insensitive
      return '/^' + reStr + '$/im.test(' + varName + ')';
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}
