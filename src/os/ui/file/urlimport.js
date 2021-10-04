goog.declareModuleId('os.ui.file.UrlImportUI');

import '../util/validationmessage.js';
import EventType from '../../events/eventtype.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';

const {default: UrlMethod} = goog.requireType('os.ui.file.method.UrlMethod');


/**
 * The URL import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/urlimport.html',
  controller: Controller,
  controllerAs: 'urlImport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'urlimport';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the URL import dialog
 * @unrestricted
 */
export class Controller {
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

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  onDestroy_() {
    if (!this.methodLoaded_) {
      this.cancelMethod_();
    }

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Create import command and close the window
   *
   * @export
   */
  accept() {
    if (!this.scope_['urlForm']['$invalid'] && this.scope_['method']) {
      this['loading'] = true;

      var method = /** @type {UrlMethod} */ (this.scope_['method']);
      method.setUrl(this['url']);
      method.listenOnce(EventType.COMPLETE, this.onLoadComplete_, false, this);
      method.listenOnce(EventType.CANCEL, this.onLoadComplete_, false, this);
      method.listenOnce(EventType.ERROR, this.onLoadError_, false, this);
      method.loadFile();
    } else {
      // TODO: display an error? this shouldn't be possible
      this.close();
    }
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    if (this.element_) {
      osWindow.close(this.element_);
    }
  }

  /**
   * Fires a cancel event on the method so listeners can respond appropriately.
   *
   * @private
   */
  cancelMethod_() {
    var method = /** @type {UrlMethod} */ (this.scope_['method']);
    if (method) {
      method.unlisten(EventType.COMPLETE, this.onLoadComplete_, false, this);
      method.unlisten(EventType.CANCEL, this.onLoadComplete_, false, this);
      method.unlisten(EventType.ERROR, this.onLoadError_, false, this);

      method.dispatchEvent(EventType.CANCEL);
    }
  }

  /**
   * Handle URL method load complete.
   *
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadComplete_(event) {
    var method = /** @type {UrlMethod} */ (event.target);
    method.unlisten(EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(EventType.ERROR, this.onLoadError_, false, this);

    this.methodLoaded_ = true;
    this['loading'] = false;
    this.close();
  }

  /**
   * Handle URL method load error. This should not close the form so the user can correct the error.
   *
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadError_(event) {
    var method = /** @type {UrlMethod} */ (event.target);
    method.unlisten(EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(EventType.ERROR, this.onLoadError_, false, this);

    this['loading'] = false;
    apply(this.scope_);
  }
}
