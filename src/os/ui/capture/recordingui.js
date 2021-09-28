goog.declareModuleId('os.ui.capture.RecordingUI');

import '../loadingbar.js';
import {getTimestamp} from '../../capture/capture.js';
import CaptureEventType from '../../capture/captureeventtype.js';
import ContentType from '../../capture/contenttype.js';
import GifEncoder from '../../capture/gifencoder.js';
import {ROOT} from '../../os.js';
import exportManager from '../file/uiexportmanager.js';
import Module from '../module.js';
import {apply} from '../ui.js';

import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';

const dispose = goog.require('goog.dispose');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');

const {default: IRecorder} = goog.requireType('os.capture.IRecorder');
const {default: IVideoEncoder} = goog.requireType('os.capture.IVideoEncoder');


/**
 * Identifier for the recording UI.
 * @type {string}
 */
const RECORDING_ID = 'recordUi';


/**
 * The recordingui directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'recorder': '='
  },
  templateUrl: ROOT + 'views/capture/recordingui.html',
  controller: Controller,
  controllerAs: 'recordui'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'recordingui';


/**
 * Add the directive to the module.
 */
Module.directive('recordingui', [directive]);


/**
 * Controller function for the recordingui directive
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
     * @type {IRecorder}
     * @private
     */
    this.recorder_ = /** @type {IRecorder} */ ($scope['recorder']);

    /**
     * @type {boolean}
     */
    this['recording'] = false;

    /**
     * @type {boolean}
     */
    this['recordingCritical'] = false;

    /**
     * @type {number}
     */
    this['progress'] = 0;

    /**
     * @type {string}
     */
    this['status'] = '';

    /**
     * @type {string}
     */
    this['title'] = 'Recording ' + getTimestamp();

    /**
     * @type {!Array<!IVideoEncoder>}
     */
    this['encoders'] = [new GifEncoder()];

    /**
     * @type {IVideoEncoder}
     */
    this['encoder'] = this['encoders'][0];

    /**
     * @type {os.ex.IPersistenceMethod}
     */
    this['persister'] = null;

    /**
     * @type {!Object<string, !os.ex.IPersistenceMethod>}
     */
    this['persisters'] = {};
    var persisters = exportManager.getPersistenceMethods();
    if (persisters && persisters.length > 0) {
      this['persister'] = persisters[0];
      for (var i = 0, n = persisters.length; i < n; i++) {
        this['persisters'][persisters[i].getLabel()] = persisters[i];
      }
    }

    // bring focus to the title input
    this.element_.find('input[name="title"]').focus();

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    dispose(this.recorder_);
    this.recorder_ = null;

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    osWindow.close(this.element_);
    this['recording'] = false;
    this.toggleRecordButton();
  }

  /**
   * Cancel the recording and close the window.
   *
   * @export
   */
  cancel() {
    if (this.recorder_) {
      this.recorder_.abort();
    }

    this.close_();
  }

  /**
   * Start the recording.
   *
   * @export
   */
  record() {
    if (this.recorder_) {
      this.recorder_.listen(CaptureEventType.PROGRESS, this.onRecordingProgress_, false, this);
      this.recorder_.listen(CaptureEventType.STATUS, this.onRecordingStatus_, false, this);
      this.recorder_.listenOnce(CaptureEventType.UNBLOCK, this.onUnblock_, false, this);
      this.recorder_.listenOnce(CaptureEventType.COMPLETE, this.onRecordingComplete_, false, this);
      this.recorder_.listenOnce(CaptureEventType.ERROR, this.onRecordingError_, false, this);

      this['recording'] = true;
      this['recordingCritical'] = true;
      this.toggleRecordButton();
      osWindow.enableModality(RECORDING_ID);
      this.recorder_.setEncoder(this['encoder']);
      this.recorder_.record();
    } else {
      AlertManager.getInstance().sendAlert('Unable to create recording: recorder not configured.',
          AlertEventSeverity.ERROR);
      this.close_();
    }
  }

  /**
   * Get the title for a video encoder.
   *
   * @param {IVideoEncoder} encoder The encoder
   * @return {string}
   * @export
   */
  getEncoderTitle(encoder) {
    return encoder && encoder.title || 'Unknown Type';
  }

  /**
   * Get the description for the encoder.
   *
   * @param {IVideoEncoder} encoder The encoder
   * @return {string}
   * @export
   */
  getEncoderDescription(encoder) {
    var description = encoder && encoder.description || '';
    if (description) {
      description = '<i class="fa fa-info-circle text-danger"></i>&nbsp;' + description;
    }

    return description;
  }

  /**
   * Handle recording progress event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRecordingProgress_(event) {
    if (this.recorder_) {
      this['progress'] = this.recorder_.progress;
      apply(this.scope_);
    }
  }

  /**
   * Handle recording unblocked event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onUnblock_(event) {
    if (this.recorder_) {
      this['recordingCritical'] = false;
      osWindow.disableModality(RECORDING_ID);
      apply(this.scope_);
    }
  }

  /**
   * Handle recording status event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRecordingStatus_(event) {
    if (this.recorder_) {
      this['status'] = this.recorder_.status;
      apply(this.scope_);
    }
  }

  /**
   * Handle recording complete.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRecordingComplete_(event) {
    if (this['persister'] && this.recorder_ && this.recorder_.data) {
      var name = this['title'] + '.' + this['encoder'].extension;
      this['persister'].save(name, this.recorder_.data, ContentType.GIF, this['title']);
    } else {
      AlertManager.getInstance().sendAlert('Unable to create recording: recording data missing.',
          AlertEventSeverity.ERROR);
    }

    this.close_();
  }

  /**
   * Handle recording error.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRecordingError_(event) {
    var recorder = /** @type {IRecorder} */ (event.target);
    if (recorder && recorder.errorMsg) {
      AlertManager.getInstance().sendAlert('Recording failed. Please see the log for more details.',
          AlertEventSeverity.ERROR);
    } else {
      // hopefully we don't get here... haven't encountered it yet
      AlertManager.getInstance().sendAlert('Unable to create recording: unspecified reason.',
          AlertEventSeverity.ERROR);
    }

    this.close_();
  }

  /**
   * Toggle record button
   */
  toggleRecordButton() {
    var recordButton = document.getElementById('timeline-record-button');

    recordButton.classList.toggle('disabled', !!this['recording']);
  }
}

/**
 * Launch the recording UI.
 *
 * @param {!IRecorder} recorder The recorder
 */
export const launchRecordingUI = function(recorder) {
  if (recorder && !osWindow.exists(RECORDING_ID)) {
    var scopeOptions = {
      'recorder': recorder
    };

    var windowOptions = {
      'id': RECORDING_ID,
      'label': recorder.title || 'Give me a title please',
      'icon': 'fa fa-circle text-danger',
      'x': 'center',
      'y': 'center',
      'width': '350',
      'min-width': '275',
      'max-width': '500',
      'height': 'auto',
      'modal': 'false',
      'show-close': 'true'
    };

    var template = `<${directiveTag} recorder="recorder"></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
