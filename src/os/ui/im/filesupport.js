goog.declareModuleId('os.ui.im.FileSupportUI');

import {getAppName, getSupportContact} from '../../config/config.js';
import EventType from '../../events/eventtype.js';
import {getUploadFile} from '../../file/fileupload.js';
import {ROOT} from '../../os.js';
import {linkify} from '../../string/string.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';
import FileSupportChoice from './filesupportchoice.js';

const Disposable = goog.require('goog.Disposable');
const Promise = goog.require('goog.Promise');
const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Dialog to prompt the user that IndexedDB is not supported.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/im/filesupport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filesupport';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the file support directive.
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * The file.
     * @type {OSFile}
     * @private
     */
    this.file_ = this.scope_['file'];

    /**
     * Callback for dialog confirmation.
     * @type {function(string=)}
     * @private
     */
    this.confirmCallback_ = this.scope_['confirm'];

    /**
     * Callback for dialog cancel.
     * @type {function(*)}
     * @private
     */
    this.cancelCallback_ = this.scope_['cancel'];

    /**
     * Key event handler.
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);

    /**
     * The application name.
     * @type {string}
     */
    this['application'] = getAppName('the application');

    /**
     * If file upload is supported by the application.
     * @type {boolean}
     */
    this['supportsUpload'] = getUploadFile() != null;

    /**
     * Support contact details.
     * @type {string}
     */
    this['supportContact'] = linkify(/** @type {string} */ (getSupportContact('your system administrator')));

    /**
     * User selection.
     * @type {!FileSupportChoice}
     */
    this['choice'] = FileSupportChoice.LOCAL;

    $scope.$on('$destroy', this.dispose.bind(this));

    if (!this.file_) {
      if (this.cancelCallback_) {
        this.cancelCallback_('Local file could not be loaded.');
      }

      this.close_();
    } else {
      $scope.$emit(WindowEventType.READY);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.keyHandler_);

    this.element_ = null;
    this.scope_ = null;
    this.file_ = null;
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    if (this.cancelCallback_) {
      this.cancelCallback_(EventType.CANCEL);
    }

    this.close_();
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  confirm() {
    const uploadFile = getUploadFile();
    if (this['choice'] === FileSupportChoice.UPLOAD && uploadFile != null) {
      uploadFile(this.file_).then(this.confirmCallback_, this.cancelCallback_);
    } else if (this.confirmCallback_) {
      this.confirmCallback_();
    }

    this.close_();
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    osWindow.close(this.element_);
  }

  /**
   * Handles key events
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.cancel();
    }
  }
}

/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {!OSFile} file The file
 * @return {!Promise<string>}
 */
export const launchFileSupport = function(file) {
  return new Promise(function(resolve, reject) {
    var scopeOptions = {
      'file': file,
      'confirm': resolve,
      'cancel': reject
    };

    var windowOptions = {
      'label': 'Unable to Store File',
      'headerClass': 'bg-warning u-bg-warning-text',
      'icon': 'fa fa-warning',
      'x': 'center',
      'y': 'center',
      'width': 550,
      'min-width': 400,
      'max-width': 800,
      'height': 'auto',
      'modal': true,
      'show-close': true
    };

    var template = '<filesupport></filesupport>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  });
};
