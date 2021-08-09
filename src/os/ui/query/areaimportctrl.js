goog.module('os.ui.query.AreaImportCtrl');
goog.module.declareLegacyNamespace();

goog.require('os.ui.im.BasicInfoUI');

const Disposable = goog.require('goog.Disposable');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {AREA_IMPORT_HELP} = goog.require('os.ui.query');
const {close} = goog.require('os.ui.window');


/**
 * Abstract controller for importing areas from a file.
 *
 * @template T
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super();

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
    this['help'] = AREA_IMPORT_HELP;

    $scope.$on('$destroy', this.dispose.bind(this));

    // trigger window auto height after the DOM is rendered
    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * Close the window
   * @export
   */
  close() {
    close(this.element);
  }

  /**
   * Load areas from the selected file(s).
   * @export
   */
  finish() {
    this['loading'] = true;
  }
}

exports = Controller;
