goog.provide('os.ui.filter.op.LikeList');

goog.require('os.ui.filter.op.InList');
goog.require('os.ui.filter.string');



/**
 * @constructor
 * @extends {os.ui.filter.op.InList}
 */
os.ui.filter.op.LikeList = function() {
  os.ui.filter.op.LikeList.base(this, 'constructor',
      'is like list', 'like list', ['string'], 'hint="like list"', 'A, b*, ...', 'fb-list');
  this.matchHint = 'like list';
};
goog.inherits(os.ui.filter.op.LikeList, os.ui.filter.op.InList);


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeList.prototype.getEvalExpression = function(varName, literal) {
  var list = this.getValuesFromLiteral(literal);
  if (list.length > 0) {
    // escape strings so they can be safely used in a RegExp
    list = list.map(function(str) {
      return os.ui.filter.string.escapeRegExp(str);
    });

    return '/^(' + list.join('|') + ')$/i.test(' + varName + ')';
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeList.prototype.getFilter = function(column, literal) {
  var f = os.ui.filter.op.LikeList.base(this, 'getFilter', column, literal);

  if (f) {
    f = f.replace(/<PropertyIsEqualTo/g, '<PropertyIsLike wildCard="*" singleChar="." escape="\\"');
    f = f.replace(/<\/PropertyIsEqualTo/g, '</PropertyIsLike');
  }

  return f;
};
