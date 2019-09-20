goog.provide('os.ui.filter.op.IsTrue');

goog.require('os.ui.filter.op.Op');


/**
 * A 'PropertyIsTrue' operation class.
 * Based on the OGC Filter Spec
 *
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.IsTrue = function() {
  os.ui.filter.op.IsTrue.base(this, 'constructor',
      'And', 'is true', 'true', undefined, undefined, 'Supports true, >1, and "true"', 'span', true);
  this.matchHint = 'true.operation';
};
goog.inherits(os.ui.filter.op.IsTrue, os.ui.filter.op.Op);

/**
 *
 * @inheritDoc
 */
os.ui.filter.op.IsTrue.prototype.getEvalExpression = function(v, literal) {
  return '(!(typeof ' + v + '==="undefined"||' + v + '==null||' + v + '.length==0)&&(' +
        v + '===true||' + v + '==1||(""+' + v + ').toLowerCase()=="true"))';
};

/**
 *
 * @inheritDoc
 */
os.ui.filter.op.IsTrue.prototype.getFilter = function(column, literal) {
  var f = [];

  f.push('<' + this.localName + '>');

  f.push(
      '<Not><PropertyIsNull>' +
        '<PropertyName>' + column + '</PropertyName>' +
      '</PropertyIsNull></Not>'
  );

  f.push('<Or>');
  f.push(
      '<PropertyIsEqualTo>' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[1]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push(
      '<PropertyIsEqualTo matchcase="false">' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[true]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push('</Or>');

  f.push('</' + this.localName + '>');

  return f.join('');
};
