goog.module('os.ui.capture.RecordingUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.LoadingBarUI');

const dispose = goog.require('goog.dispose');
const {ROOT} = goog.require('os');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const capture = goog.require('os.capture');
const GifEncoder = goog.require('os.capture.GifEncoder');
const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const exportManager = goog.require('os.ui.exportManager');
const osWindow = goog.require('os.ui.window');

const IRecorder = goog.requireType('os.capture.IRecorder');


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
const directive = () => ({
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
const directiveTag = 'recordingui';


/**
 * Add the directive to the module.
 */
Module.directive('recordingui', [directive]);


/**
 * Controller function for the recordingui directive
 * @unrestricted
 */
class Controller {
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
     * @type {capture.IRecorder}
     * @private
     */
    this.recorder_ = /** @type {capture.IRecorder} */ ($scope['recorder']);

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
    this['title'] = 'Recording ' + capture.getTimestamp();

    /**
     * @type {!Array<!capture.IVideoEncoder>}
     */
    this['encoders'] = [new GifEncoder()];

    /**
     * @type {capture.IVideoEncoder}
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
      this.recorder_.listen(capture.CaptureEventType.PROGRESS, this.onRecordingProgress_, false, this);
      this.recorder_.listen(capture.CaptureEventType.STATUS, this.onRecordingStatus_, false, this);
      this.recorder_.listenOnce(capture.CaptureEventType.UNBLOCK, this.onUnblock_, false, this);
      this.recorder_.listenOnce(capture.CaptureEventType.COMPLETE, this.onRecordingComplete_, false, this);
      this.recorder_.listenOnce(capture.CaptureEventType.ERROR, this.onRecordingError_, false, this);

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
   * @param {capture.IVideoEncoder} encoder The encoder
   * @return {string}
   * @export
   */
  getEncoderTitle(encoder) {
    return encoder && encoder.title || 'Unknown Type';
  }

  /**
   * Get the description for the encoder.
   *
   * @param {capture.IVideoEncoder} encoder The encoder
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
      ui.apply(this.scope_);
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
      ui.apply(this.scope_);
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
      ui.apply(this.scope_);
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
      this['persister'].save(name, this.recorder_.data, capture.ContentType.GIF, this['title']);
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
    var recorder = /** @type {capture.IRecorder} */ (event.target);
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
const launchRecordingUI = function(recorder) {
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

exports = {
  Controller,
  directive,
  directiveTag,
  launchRecordingUI
};
