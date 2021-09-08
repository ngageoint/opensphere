goog.module('os.ui.filter.ColTypeListUI');

const GoogEventType = goog.require('goog.events.EventType');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const clipboard = goog.require('os.ui.clipboard');
const FilterPatterns = goog.require('os.ui.filter.FilterPatterns');


/**
 * The column type list validation
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  require: 'ngModel',
  controller: Controller,
  link: colTypeListLink
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'coltypelist';

/**
 * Controller function for the colTypeListValidation directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * Match newline, linefeed or tab, but only if followed by more non-whitespace characters
     * @type {RegExp}
     * @private
     */
    this.regex_ = /[\n\r\t](?=[\S])/g;

    this.element_.on(GoogEventType.PASTE, this.onPaste_.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Handle paste event to massage text before placing in the input control.
   *
   * @param {!jQuery.Event} e
   * @private
   */
  onPaste_(e) {
    var text = clipboard.getData(e.originalEvent);
    if (text != null) {
      var that = this;
      setTimeout(function() {
        that.scope_['expr']['literal'] = that.scope_['expr']['literal'].
            replace(that.regex_, ', ').
            replace(/[\n\r\t]\s*/g, '').trim();
        apply(that.scope_);
      }, 10);
    }
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.element_.off(GoogEventType.PASTE);
    this.scope_ = null;
    this.element_ = null;
  }
}

/**
 * The link function for list type validation
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {*} $attrs
 * @param {*} $ctrl
 * @ngInject
 */
const colTypeListLink = function($scope, $element, $attrs, $ctrl) {
  $ctrl.$parsers.unshift(
      /**
       * @param {string} viewValue
       * @return {string|undefined}
       */
      function(viewValue) {
        var key = $scope['expr']['column']['type'];
        var pattern = FilterPatterns[key];
        var values = viewValue ? viewValue.split(/\s*,\s*/) : null;
        var ret = viewValue;

        $ctrl.$setValidity('type', true);
        $element.attr('title', '');

        if (values && values.length) {
          for (var i = 0, n = values.length; i < n; i++) {
            var val = values[i];
            if (pattern && !val || !pattern.test(val)) {
              $ctrl.$setValidity('type', false);
              $element.attr('title', 'Please enter a valid ' + key + ' for item ' + (i + 1));
              ret = undefined;
              break;
            }
          }
        } else {
          $ctrl.$setValidity('type', false);
          $element.attr('title', 'Please enter a value');
          ret = undefined;
        }

        return ret;
      });
};

/**
 * Add directive to module
 */
Module.directive(directiveTag, [directive]);

exports = {
  Controller,
  directive,
  directiveTag
};
