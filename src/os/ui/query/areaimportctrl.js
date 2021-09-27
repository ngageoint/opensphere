goog.declareModuleId('os.ui.query.AreaImportCtrl');

import '../im/basicinfo.js';
import {close} from '../window.js';
import WindowEventType from '../windoweventtype.js';
import {AREA_IMPORT_HELP} from './query.js';

const Disposable = goog.require('goog.Disposable');


/**
 * Abstract controller for importing areas from a file.
 *
 * @template T
 * @unrestricted
 */
export default class Controller extends Disposable {
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
