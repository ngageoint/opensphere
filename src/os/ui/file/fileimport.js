goog.declareModuleId('os.ui.file.FileImportUI');

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import EventType from '../../events/eventtype.js';
import {createFromFile} from '../../file/index.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';
import windowSelector from '../windowselector.js';

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: IFileMethod} = goog.requireType('os.file.IFileMethod');


/**
 * The file import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/fileimport.html',
  controller: Controller,
  controllerAs: 'fileImport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'fileimport';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the file import dialog
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * @type {boolean}
     * @private
     */
    this.importComplete_ = false;

    /**
     * @type {?File}
     */
    this['file'] = null;

    /**
     * @type {?string}
     */
    this['fileName'] = null;

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    /**
     * @type {?Element}
     * @private
     */
    this.fileInputEl_ = dom.createDom(TagName.INPUT, {
      'type': 'file',
      'name': 'file',
      'class': 'd-none',
      'id': 'fileImportId'
    });
    dom.appendChild(dom.getElement(windowSelector.CONTAINER.substring(1)), this.fileInputEl_);
    googEvents.listen(this.fileInputEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.onDestroy.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @protected
   */
  onDestroy() {
    googEvents.unlisten(this.fileInputEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);
    dom.removeNode(this.fileInputEl_);
    this.fileInputEl_ = null;

    this['file'] = null;

    if (!this.importComplete_) {
      this.cancelMethod_();
    }

    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * Create import command and close the window
   *
   * @export
   */
  accept() {
    if (this.scope_['method'] && this['file']) {
      this['loading'] = true;
      var reader = createFromFile(this['file']);
      if (reader) {
        reader.addCallbacks(this.handleResult_, this.handleError_, this);
      }
    } else {
      this.close();
    }
  }

  /**
   * Handler for successful file read.
   *
   * @param {OSFile} file The file.
   * @private
   */
  handleResult_(file) {
    if (file) {
      var method = /** @type {IFileMethod} */ (this.scope_['method']);
      method.setFile(file);
      method.loadFile();

      this.importComplete_ = true;
    }

    this.close();
  }

  /**
   * Handler for failed file read. Display an error message and close the window.
   *
   * @param {string} errorMsg The error message.
   * @private
   */
  handleError_(errorMsg) {
    this['loading'] = false;

    if (!errorMsg || typeof errorMsg !== 'string') {
      var fileName = this['file'] ? this['file'].name : 'unknown';
      errorMsg = 'Unable to load file "' + fileName + '"!';
    }

    log.error(logger, errorMsg);
    AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
    this.close();
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Launch the system file browser.
   *
   * @export
   */
  openFileBrowser() {
    this.fileInputEl_.click();
  }

  /**
   * Grabs the file from the hidden input element and sets the name on the text element.
   *
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  onFileChange_(event) {
    if (this.fileInputEl_.files && this.fileInputEl_.files.length > 0) {
      this['file'] = this.fileInputEl_.files[0];
    }

    this.timeout_(function() {
      this['fileName'] = this['file'] != null ? /** @type {File} */ (this['file']).name : null;
    }.bind(this));
  }

  /**
   * Fires a cancel event on the method so listeners can respond appropriately.
   *
   * @private
   */
  cancelMethod_() {
    if (this.scope_['method']) {
      var method = /** @type {IFileMethod} */ (this.scope_['method']);
      method.dispatchEvent(EventType.CANCEL);
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.FileImportCtrl');
