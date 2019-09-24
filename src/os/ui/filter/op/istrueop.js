goog.provide('os.ui.filter.op.IsTrue');

goog.require('os.ui.filter.op.Op');
goog.require('os.xsd.DataType');


/**
 * A 'PropertyIsTrue' operation class.
 * Based on the OGC Filter Spec
 *
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.IsTrue = function() {
  os.ui.filter.op.IsTrue.base(this, 'constructor',
      'And', 'is true', 'true',
      [os.xsd.DataType.BOOLEAN, os.xsd.DataType.INTEGER, os.xsd.DataType.STRING],
      'hint="os.ui.filter.op.IsTrue"', 'Supports true, 1, and "true" (case insensitive)', 'span', true);
  this.matchHint = 'os.ui.filter.op.IsTrue';
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
        '<Literal><![CDATA[1]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push(
      '<PropertyIsEqualTo matchCase="false">' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[true]]></Literal>' +
      '</PropertyIsEqualTo>'
  );
  f.push('</Or>');

  f.push('</' + this.localName + '>');

  return f.join('');
};
