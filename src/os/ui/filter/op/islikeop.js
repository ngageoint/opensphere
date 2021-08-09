goog.module('os.ui.filter.op.IsLike');
goog.module.declareLegacyNamespace();

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {escapeRegExp} = goog.require('os.ui.filter.string');
const DataType = goog.require('os.xsd.DataType');


/**
 * A 'PropertyIsLike' operation class.
 */
class IsLike extends Op {
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

exports = IsLike;
