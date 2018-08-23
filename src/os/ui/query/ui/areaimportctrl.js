goog.provide('os.ui.query.ui.AreaImportCtrl');

goog.require('goog.Disposable');
goog.require('os.ui.im.basicInfoDirective');
goog.require('os.ui.query');
goog.require('os.ui.window');



/**
 * Abstract controller for importing areas from a file.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 * @template T
 */
os.ui.query.ui.AreaImportCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {T}
   * @protected
   */
  this.config = $scope['config'];

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {!Object<string, string>}
   */
  this['help'] = os.ui.query.AREA_IMPORT_HELP;

  $scope.$on('$destroy', this.dispose.bind(this));

  // trigger window auto height after the DOM is rendered
  $timeout(function() {
    $scope.$emit(os.ui.WindowEventType.READY);
  });
};
goog.inherits(os.ui.query.ui.AreaImportCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.query.ui.AreaImportCtrl.prototype.disposeInternal = function() {
  os.ui.query.ui.AreaImportCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Close the window
 */
os.ui.query.ui.AreaImportCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.query.ui.AreaImportCtrl.prototype,
    'close',
    os.ui.query.ui.AreaImportCtrl.prototype.close);


/**
 * Load areas from the selected file(s).
 */
os.ui.query.ui.AreaImportCtrl.prototype.finish = function() {
  this['loading'] = true;
};
goog.exportProperty(
    os.ui.query.ui.AreaImportCtrl.prototype,
    'finish',
    os.ui.query.ui.AreaImportCtrl.prototype.finish);
