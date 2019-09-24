goog.provide('os.ui.filter.op.IsFalse');

goog.require('os.ui.filter.op.Op');
goog.require('os.xsd.DataType');


/**
 * A 'PropertyIsFalse' operation class.
 * Based on the OGC Filter Spec
 *
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.IsFalse = function() {
  os.ui.filter.op.IsFalse.base(this, 'constructor',
      'And', 'is false', 'false',
      [os.xsd.DataType.BOOLEAN, os.xsd.DataType.INTEGER, os.xsd.DataType.STRING],
      'hint="os.ui.filter.op.IsFalse"', 'Supports false, 0, and "false" (case insensitive)', 'span', true);
  this.matchHint = 'os.ui.filter.op.IsFalse';
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
  var attr = this.getAttributes();

  f.push('<' + this.localName + (attr ? ' ' + attr : '') + '>');

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
      '<PropertyIsEqualTo matchCase="false">' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[false]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push('</Or>');

  f.push('</' + this.localName + '>');

  return f.join('');
};
