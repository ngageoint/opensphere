goog.declareModuleId('os.ui.filter.op.IsNull');

import Op from './op.js';


/**
 * A 'PropertyIsNull' operation class.
 */
export default class IsNull extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsNull', 'is empty', 'empty', undefined, undefined, undefined, 'span', true);
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    return '(' + varName + '==null||' + varName + '==="")';
  }
}
