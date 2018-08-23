goog.provide('os.ui.file.UrlImportCtrl');
goog.provide('os.ui.file.urlImportDirective');

goog.require('os.ui.Module');
goog.require('os.ui.util.validationMessageDirective');


/**
 * The URL import directive
 * @return {angular.Directive}
 */
os.ui.file.urlImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/urlimport.html',
    controller: os.ui.file.UrlImportCtrl,
    controllerAs: 'urlImport'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('urlimport', [os.ui.file.urlImportDirective]);



/**
 * Controller for the URL import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.file.UrlImportCtrl = function($scope, $element) {
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
   * @type {boolean}
   * @private
   */
  this.methodLoaded_ = false;

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {string}
   */
  this['url'] = '';

  // bring focus to the url input
  this.element_.find('input[name="url"]').focus();

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.file.UrlImportCtrl.prototype.onDestroy_ = function() {
  if (!this.methodLoaded_) {
    this.cancelMethod_();
  }

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Create import command and close the window
 */
os.ui.file.UrlImportCtrl.prototype.accept = function() {
  if (!this.scope_['urlForm']['$invalid'] && this.scope_['method']) {
    this['loading'] = true;

    var method = /** @type {os.ui.file.method.UrlMethod} */ (this.scope_['method']);
    method.setUrl(this['url']);
    method.listenOnce(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.listenOnce(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
    method.listenOnce(os.events.EventType.ERROR, this.onLoadError_, false, this);
    method.loadFile();
  } else {
    // TODO: display an error? this shouldn't be possible
    this.close();
  }
};
goog.exportProperty(
    os.ui.file.UrlImportCtrl.prototype,
    'accept',
    os.ui.file.UrlImportCtrl.prototype.accept);


/**
 * Close the window.
 */
os.ui.file.UrlImportCtrl.prototype.close = function() {
  if (this.element_) {
    os.ui.window.close(this.element_);
  }
};
goog.exportProperty(
    os.ui.file.UrlImportCtrl.prototype,
    'close',
    os.ui.file.UrlImportCtrl.prototype.close);


/**
 * Fires a cancel event on the method so listeners can respond appropriately.
 * @private
 */
os.ui.file.UrlImportCtrl.prototype.cancelMethod_ = function() {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (this.scope_['method']);
  if (method) {
    method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

    method.dispatchEvent(os.events.EventType.CANCEL);
  }
};


/**
 * Handle URL method load complete.
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.UrlImportCtrl.prototype.onLoadComplete_ = function(event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

  this.methodLoaded_ = true;
  this['loading'] = false;
  this.close();
};


/**
 * Handle URL method load error. This should not close the form so the user can correct the error.
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.UrlImportCtrl.prototype.onLoadError_ = function(event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

  this['loading'] = false;
  os.ui.apply(this.scope_);
};
