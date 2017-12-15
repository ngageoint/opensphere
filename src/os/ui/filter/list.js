goog.provide('os.ui.filter.ColTypeListCtrl');
goog.provide('os.ui.filter.colTypeListValidation');
goog.provide('os.ui.filter.listDirective');

goog.require('os.ui.Module');
goog.require('os.ui.clipboard');


/**
 * The default list literal directive
 * @return {angular.Directive}
 */
os.ui.filter.listDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/list.html'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('fbList', [os.ui.filter.listDirective]);


/**
 * The column type list validation
 * @return {angular.Directive}
 */
os.ui.filter.colTypeListValidation = function() {
  return {
    require: 'ngModel',
    controller: os.ui.filter.ColTypeListCtrl,
    link: os.ui.filter.colTypeListLink
  };
};



/**
 * Controller function for the colTypeListValidation directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ColTypeListCtrl = function($scope, $element) {
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
   * Match newline, linefeed or tab, but only if followed by more words
   * @type {RegExp}
   * @private
   */
  this.regex_ = /[\n\r\t](?=[\w+-.,!@#$%^&*();\\\/|<>"'])/g;

  this.element_.on(goog.events.EventType.PASTE, this.onPaste_.bind(this));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Handle paste event to massage text before placing in the input control.
 * @param {!jQuery.Event} e
 * @private
 */
os.ui.filter.ColTypeListCtrl.prototype.onPaste_ = function(e) {
  var text = os.ui.clipboard.getData(e.originalEvent);
  if (goog.isDefAndNotNull(text)) {
    setTimeout(goog.bind(function() {
      this.scope_['expr']['literal'] = text.replace(this.regex_, ', ').replace(/[\n\r\t]/g, '').trim();
      os.ui.apply(this.scope_);
    }, this), 10);
  }
};


/**
 * Clean up.
 * @private
 */
os.ui.filter.ColTypeListCtrl.prototype.destroy_ = function() {
  this.element_.off(goog.events.EventType.PASTE);
  this.scope_ = null;
  this.element_ = null;
};


/**
 * The link function for list type validation
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {*} $attrs
 * @param {*} $ctrl
 * @ngInject
 */
os.ui.filter.colTypeListLink = function($scope, $element, $attrs, $ctrl) {
  $ctrl.$parsers.unshift(
      /**
       * @param {string} viewValue
       * @return {string|undefined}
       */
      function(viewValue) {
        var key = $scope['expr']['column']['type'];
        var pattern = os.ui.filter.PATTERNS[key];
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
os.ui.Module.directive('coltypelist', [os.ui.filter.colTypeListValidation]);
