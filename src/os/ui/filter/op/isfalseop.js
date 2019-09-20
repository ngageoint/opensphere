goog.provide('os.ui.filter.op.IsFalse');

goog.require('os.ui.filter.op.Op');


/**
 * A 'PropertyIsFalse' operation class.
 *
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.IsFalse = function() {
  os.ui.filter.op.IsFalse.base(this, 'constructor',
      'And', 'is false', 'false', undefined, undefined, 'Supports false, 0, and "false"', 'span', true);
  this.matchHint = 'false.operation';
};
goog.inherits(os.ui.filter.op.IsFalse, os.ui.filter.op.Op);

/**
 * Because OpenSphere allows isEmpty() comparator for Boolean type properties, fail null/empty tests
 *
 * @inheritDoc
 */
os.ui.filter.op.IsFalse.prototype.getEvalExpression = function(v, literal) {
  return '(!(typeof ' + v + '==="undefined"||' + v + '==null||' + v + '.length==0)&&(' +
      v + '===false||' + v + '==0||(""+' + v + ').toLowerCase()=="false"))';
};

/**
 *
 * @inheritDoc
 */
os.ui.filter.op.IsFalse.prototype.getFilter = function(column, literal) {
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
        '<Literal><![CDATA[0]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push(
      '<PropertyIsEqualTo matchcase="false">' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[false]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push('</Or>');

  f.push('</' + this.localName + '>');

  return f.join('');
};
