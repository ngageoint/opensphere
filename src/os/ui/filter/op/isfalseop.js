goog.module('os.ui.filter.op.IsFalse');

const Op = goog.require('os.ui.filter.op.Op');
const DataType = goog.require('os.xsd.DataType');


/**
 * A 'PropertyIsFalse' operation class.
 * Based on the OGC Filter Spec
 */
class IsFalse extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'And',
        'is false',
        'false',
        [DataType.BOOLEAN, DataType.INTEGER, DataType.STRING],
        'hint="is false"',
        'Supports false, 0, and "false" (case insensitive)',
        'span',
        true
    );
    this.matchHint = 'is false';
  }

  /**
   * Because OpenSphere allows isEmpty() comparator for Boolean type properties, fail null/empty tests
   *
   * @inheritDoc
   */
  getEvalExpression(v, literal) {
    return '(' + v + '===false||' + v + '===0||String(' + v + ').toLowerCase()==="false")';
  }

  /**
   *
   * @inheritDoc
   */
  getFilter(column, literal) {
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
  }
}

exports = IsFalse;
