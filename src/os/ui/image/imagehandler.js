goog.provide('os.ui.image.ImageHandlerCtrl');
goog.provide('os.ui.image.ImageHandlerDirective');
goog.require('os.ui.Module');



/**
 * Directive for allowing clients to handle when images fail to load.  Simply pass in a function to the
 * <code>error-handler</code> parameter, and the function will get called with a JQuery event if the image fails to
 * load.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!angular.$compile} $compile
 * @param {!Object.<string, string>} $attrs
 * @constructor
 * @ngInject
 */
os.ui.image.ImageHandlerCtrl = function($scope, $element, $timeout, $compile, $attrs) {
  /** @private */
  this.scope_ = $scope;

  /** @private */
  this.element_ = $element;

  /** @private */
  this.timeout_ = $timeout;

  this['waiting'] = true;

  this.element_.on('load', this.onLoad_.bind(this));
  this.element_.on('error', this.errorHandler_.bind(this));

  this.element_.after(/** @type {Element} */ ($compile('<i id="imageTempSpinner" ' +
      'class="fa fa-4x fa-spin fa-spinner color-gray" ng-show="imgCtrl.waiting"></i>')($scope)));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Kills off the spinner.
 * @param {Event} event
 * @private
 */
os.ui.image.ImageHandlerCtrl.prototype.onLoad_ = function(event) {
  this.timeout_(goog.bind(function() {
    this['waiting'] = false;
    this.element_.siblings('i#imageTempSpinner').remove();
  }, this));
};


/**
 * Kills off the spinner and calls the specified error-handler function.
 * @param {Event} event
 * @private
 */
os.ui.image.ImageHandlerCtrl.prototype.errorHandler_ = function(event) {
  this.onLoad_(event);
  this.timeout_(goog.bind(function() {
    if (this.scope_['errorHandler']) {
      this.scope_['errorHandler'].call(this, event);
    }
  }, this));
};


/**
 * Clear references to Angular/DOM elements.
 * @private
 */
os.ui.image.ImageHandlerCtrl.prototype.destroy_ = function() {
  // remove all JQuery listeners
  this.element_.off();
  this.timeout_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * @return {angular.Directive}
 */
os.ui.image.ImageHandlerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'imageSrc': '=',
      'errorHandler': '='
    },
    template: '<img ng-src="{{imageSrc}}"/>',
    controller: os.ui.image.ImageHandlerCtrl,
    controllerAs: 'imgCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('imageHandler', [os.ui.image.ImageHandlerDirective]);
