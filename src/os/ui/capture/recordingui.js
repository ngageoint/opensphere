goog.provide('os.ui.capture.RecordingUI');
goog.provide('os.ui.capture.recordingUIDirective');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alertManager');
goog.require('os.capture');
goog.require('os.capture.GifEncoder');
goog.require('os.capture.ffmpegEncoder');
goog.require('os.file.persist.FilePersistence');
goog.require('os.ui.Module');
goog.require('os.ui.exportManager');
goog.require('os.ui.loadingBarDirective');


/**
 * The recordingui directive
 * @return {angular.Directive}
 */
os.ui.capture.recordingUIDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'recorder': '='
    },
    templateUrl: os.ROOT + 'views/capture/recordingui.html',
    controller: os.ui.capture.RecordingUI,
    controllerAs: 'recordui'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('recordingui', [os.ui.capture.recordingUIDirective]);


/**
 * @type {string}
 * @const
 */
os.ui.capture.RECORDING_ID = 'recordUi';



/**
 * Controller function for the recordingui directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.capture.RecordingUI = function($scope, $element) {
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
   * @type {os.capture.IRecorder}
   * @private
   */
  this.recorder_ = /** @type {os.capture.IRecorder} */ ($scope['recorder']);

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
  this['title'] = 'Recording ' + os.capture.getTimestamp();

  /**
   * @type {!Array<!os.capture.IVideoEncoder>}
   */
  this['encoders'] = [new os.capture.GifEncoder()];

  /**
   * @type {os.capture.IVideoEncoder}
   */
  this['encoder'] = this['encoders'][0];

  // only Chrome supports creating WebM videos
  //
  // @note This has been disabled because on some machines it consistently reports changes in frame width.
  //
  // if (goog.userAgent.WEBKIT) {
  this['encoders'].push(new os.capture.ffmpegEncoder());
  // }

  /**
   * @type {os.ex.IPersistenceMethod}
   */
  this['persister'] = null;

  /**
   * @type {!Object<string, !os.ex.IPersistenceMethod>}
   */
  this['persisters'] = {};
  var persisters = os.ui.exportManager.getPersistenceMethods();
  if (persisters && persisters.length > 0) {
    this['persister'] = persisters[0];
    for (var i = 0, n = persisters.length; i < n; i++) {
      this['persisters'][persisters[i].getLabel()] = persisters[i];
    }
  }

  // bring focus to the title input
  this.element_.find('input[name="title"]').focus();

  $scope.$emit('window.ready');
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.capture.RecordingUI.prototype.destroy_ = function() {
  goog.dispose(this.recorder_);
  this.recorder_ = null;

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Close the window.
 * @private
 */
os.ui.capture.RecordingUI.prototype.close_ = function() {
  os.ui.window.close(this.element_);
  this['recording'] = false;
  this.toggleRecordButton();
};


/**
 * Cancel the recording and close the window.
 */
os.ui.capture.RecordingUI.prototype.cancel = function() {
  if (this.recorder_) {
    this.recorder_.abort();
  }

  this.close_();
};
goog.exportProperty(
    os.ui.capture.RecordingUI.prototype,
    'cancel',
    os.ui.capture.RecordingUI.prototype.cancel);


/**
 * Start the recording.
 */
os.ui.capture.RecordingUI.prototype.record = function() {
  if (this.recorder_) {
    this.recorder_.listen(os.capture.CaptureEventType.PROGRESS, this.onRecordingProgress_, false, this);
    this.recorder_.listen(os.capture.CaptureEventType.STATUS, this.onRecordingStatus_, false, this);
    this.recorder_.listenOnce(os.capture.CaptureEventType.UNBLOCK, this.onUnblock_, false, this);
    this.recorder_.listenOnce(os.capture.CaptureEventType.COMPLETE, this.onRecordingComplete_, false, this);
    this.recorder_.listenOnce(os.capture.CaptureEventType.ERROR, this.onRecordingError_, false, this);

    this['recording'] = true;
    this['recordingCritical'] = true;
    this.toggleRecordButton();
    os.ui.window.enableModality(os.ui.capture.RECORDING_ID);
    this.recorder_.setEncoder(this['encoder']);
    this.recorder_.record();
  } else {
    os.alertManager.sendAlert('Unable to create recording: recorder not configured.',
        os.alert.AlertEventSeverity.ERROR);
    this.close_();
  }
};
goog.exportProperty(
    os.ui.capture.RecordingUI.prototype,
    'record',
    os.ui.capture.RecordingUI.prototype.record);


/**
 * Get the title for a video encoder.
 * @param {os.capture.IVideoEncoder} encoder The encoder
 * @return {string}
 */
os.ui.capture.RecordingUI.prototype.getEncoderTitle = function(encoder) {
  return encoder && encoder.title || 'Unknown Type';
};
goog.exportProperty(
    os.ui.capture.RecordingUI.prototype,
    'getEncoderTitle',
    os.ui.capture.RecordingUI.prototype.getEncoderTitle);


/**
 * Get the description for the encoder.
 * @param {os.capture.IVideoEncoder} encoder The encoder
 * @return {string}
 */
os.ui.capture.RecordingUI.prototype.getEncoderDescription = function(encoder) {
  var description = encoder && encoder.description || '';
  if (description) {
    description = '<i class="fa fa-info-circle"></i>&nbsp;' + description;
  }

  return description;
};
goog.exportProperty(
    os.ui.capture.RecordingUI.prototype,
    'getEncoderDescription',
    os.ui.capture.RecordingUI.prototype.getEncoderDescription);


/**
 * Handle recording progress event.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.capture.RecordingUI.prototype.onRecordingProgress_ = function(event) {
  if (this.recorder_) {
    this['progress'] = this.recorder_.progress;
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle recording unblocked event.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.capture.RecordingUI.prototype.onUnblock_ = function(event) {
  if (this.recorder_) {
    this['recordingCritical'] = false;
    os.ui.window.disableModality(os.ui.capture.RECORDING_ID);
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle recording status event.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.capture.RecordingUI.prototype.onRecordingStatus_ = function(event) {
  if (this.recorder_) {
    this['status'] = this.recorder_.status;
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle recording complete.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.capture.RecordingUI.prototype.onRecordingComplete_ = function(event) {
  if (this['persister'] && this.recorder_ && this.recorder_.data) {
    var name = this['title'] + '.' + this['encoder'].extension;
    this['persister'].save(name, this.recorder_.data, os.capture.ContentType.MP4, this['title']);
  } else {
    os.alertManager.sendAlert('Unable to create recording: recording data missing.',
        os.alert.AlertEventSeverity.ERROR);
  }

  this.close_();
};


/**
 * Handle recording error.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.capture.RecordingUI.prototype.onRecordingError_ = function(event) {
  var recorder = /** @type {os.capture.IRecorder} */ (event.target);
  if (recorder && recorder.errorMsg) {
    os.alertManager.sendAlert('Recording failed. Please see the log for more details.',
        os.alert.AlertEventSeverity.ERROR);
  } else {
    // hopefully we don't get here... haven't encountered it yet
    os.alertManager.sendAlert('Unable to create recording: unspecified reason.',
        os.alert.AlertEventSeverity.ERROR);
  }

  this.close_();
};


/**
 * Toggle record button
 */
os.ui.capture.RecordingUI.prototype.toggleRecordButton = function() {
  var recordButton = document.getElementById('timeline-record-button');

  recordButton.classList.toggle('disabled', !!this['recording']);
};


/**
 * Launch the recording UI.
 * @param {!os.capture.IRecorder} recorder The recorder
 */
os.ui.capture.launchRecordingUI = function(recorder) {
  if (recorder && !os.ui.window.exists(os.ui.capture.RECORDING_ID)) {
    var scopeOptions = {
      'recorder': recorder
    };

    var windowOptions = {
      'id': os.ui.capture.RECORDING_ID,
      'label': recorder.title || 'Give me a title please',
      'icon': 'fa fa-circle red-icon',
      'x': 'center',
      'y': 'center',
      'width': '325',
      'min-width': '250',
      'max-width': '500',
      'height': 'auto',
      'modal': 'false',
      'show-close': 'true'
    };

    var template = '<recordingui recorder="recorder"></recordingui>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
