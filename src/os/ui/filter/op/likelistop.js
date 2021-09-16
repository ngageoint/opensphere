goog.module('os.ui.filter.op.LikeList');

const InList = goog.require('os.ui.filter.op.InList');
const Op = goog.require('os.ui.filter.op.Op');
const {escapeRegExp} = goog.require('os.ui.filter.string');


/**
 */
class LikeList extends InList {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'is like list',
        'like list',
        ['string'],
        'hint="like list"',
        'e.g. a, b*, ...' + Op.TEXT.CASE_INSENSITIVE,
        'fb-list',
        undefined,
        Op.TEXT.CASE_INSENSITIVE_TITLE,
        Op.TEXT.CASE_INSENSITIVE_DETAIL
    );
    this.matchHint = 'like list';
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    var list = this.getValuesFromLiteral(literal);
    if (list.length > 0) {
      // escape strings so they can be safely used in a RegExp
      list = list.map(function(str) {
        return escapeRegExp(str);
      });

      return '/^(' + list.join('|') + ')$/im.test(' + varName + ')';
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    var f = super.getFilter(column, literal);

    if (f) {
      f = f.replace(/<PropertyIsEqualTo/g, '<PropertyIsLike wildCard="*" singleChar="." escape="\\"');
      f = f.replace(/<\/PropertyIsEqualTo/g, '</PropertyIsLike');
    }

    return f;
  }
}

exports = LikeList;
