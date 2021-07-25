goog.module('os.ui.filter.op.InList');
goog.module.declareLegacyNamespace();

const FilterPatterns = goog.require('os.ui.filter.FilterPatterns');
const {directiveTag} = goog.require('os.ui.filter.ListUI');
const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 */
class InList extends Op {
  /**
   * Constructor.
   * @param {string=} opt_title
   * @param {string=} opt_shortTitle
   * @param {?Array.<string>=} opt_supportedTypes
   * @param {string=} opt_attrs
   * @param {string=} opt_hint
   * @param {string=} opt_ui
   * @param {boolean=} opt_noLiteral Whether to exclude the literal value
   * @param {string=} opt_popoverTitle title for a popover, if wanted; default "Info"
   * @param {string=} opt_popoverContent content for a popover, if wanted
   */
  constructor(
      opt_title,
      opt_shortTitle,
      opt_supportedTypes,
      opt_attrs,
      opt_hint,
      opt_ui,
      opt_noLiteral,
      opt_popoverTitle,
      opt_popoverContent
  ) {
    opt_title = opt_title || 'is in list';
    opt_shortTitle = opt_shortTitle || 'in list';
    opt_supportedTypes = opt_supportedTypes || null;
    opt_attrs = opt_attrs || 'hint="in list"';
    opt_hint = opt_hint || 'e.g. A, b, ...' + Op.TEXT.CASE_SENSITIVE;
    opt_ui = opt_ui || directiveTag;
    opt_popoverTitle = opt_popoverTitle || Op.TEXT.CASE_SENSITIVE_TITLE;
    opt_popoverContent = opt_popoverContent || Op.TEXT.CASE_SENSITIVE_DETAIL;

    super(
        'Or',
        opt_title,
        opt_shortTitle,
        opt_supportedTypes,
        opt_attrs,
        opt_hint,
        opt_ui,
        opt_noLiteral,
        opt_popoverTitle,
        opt_popoverContent
    );
    this.matchHint = 'in list';
  }

  /**
   * Parses trimmed, non-empty values from a comma-separated list.
   *
   * @param {?string} literal The literal.
   * @return {!Array<string>} Parsed non-empty list values.
   * @protected
   */
  getValuesFromLiteral(literal) {
    var result = [];

    if (literal) {
      var list = literal.trim().split(/\s*,\s*/);
      if (list.length > 0) {
        for (var i = 0; i < list.length; i++) {
          var str = list[i].trim();
          if (str) {
            result.push(str);
          }
        }
      }
    }

    return result;
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    var list = this.getValuesFromLiteral(literal);
    if (list.length > 0) {
      // surround all values in double quotes
      list = list.map(quoteString);

      return '([' + list.join(',') + ']).indexOf(String(' + varName + '))!=-1';
    }

    // couldn't parse values, so don't return an expression
    return '';
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    var f = '';

    var list = this.getValuesFromLiteral(literal);
    if (list.length > 0) {
      var attr = this.getAttributes();
      f = '<' + this.localName + (attr ? ' ' + attr : '') + '>';

      for (var i = 0, n = list.length; i < n; i++) {
        f += '<PropertyIsEqualTo>' +
            '<PropertyName>' + column + '</PropertyName>' +
            '<Literal><![CDATA[' + list[i].trim() + ']]></Literal>' +
            '</PropertyIsEqualTo>';
      }

      f += '</' + this.localName + '>';
    }

    return f;
  }

  /**
   * @inheritDoc
   */
  getLiteral(el) {
    var arr = el.find('Literal');
    var literals = [];

    arr.each(function(i, domEl) {
      literals.push($(domEl).text());
    });

    return literals.join(', ');
  }

  /**
   * @inheritDoc
   */
  matches(el) {
    if (el) {
      return el.attr('hint') == this.matchHint;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  validate(value, key) {
    var valid = false;
    if (value) {
      var list = value.trim().split(/\s*,\s*/);
      var pattern = FilterPatterns[key];
      valid = true;

      for (var i = 0, n = list.length; i < n; i++) {
        if (!pattern.test(list[i])) {
          valid = false;
          break;
        }
      }
    }

    return valid;
  }
}

exports = InList;
