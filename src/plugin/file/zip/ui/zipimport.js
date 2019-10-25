goog.provide('plugin.file.zip.ui.ZIPImportCtrl');
goog.provide('plugin.file.zip.ui.zipImportDirective');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.FileDescriptor');
goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.im.ImportProcess');
goog.require('os.ui.Module');
goog.require('os.ui.file.FileImportCtrl');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.wiz.wizardDirective');


/**
 * The ZIP import directive; use the Wizard Directive
 *
 * @return {angular.Directive}
 */
plugin.file.zip.ui.zipImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/zip/zipimport.html',
    controller: plugin.file.zip.ui.ZIPImportCtrl,
    controllerAs: 'ctrl'
  };
};
os.ui.Module.directive('zipimport', [plugin.file.zip.ui.zipImportDirective]);


/**
 * Controller for the ZIP import dialog
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.file.FileImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.file.zip.ui.ZIPImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'constructor', $scope, $element, $timeout);

  /**
   * @type {angular.$timeout|null}
   * @private
   */
  this.timeout__ = $timeout;

  /**
   * @type {os.ui.im.ImportManager}
   * @private
   */
  this.im_ = os.ui.im.ImportManager.getInstance();

  /**
   * @type {!Array<Object>|null}
   * @private
   */
  this.importers_;

  /**
   * @type {Object}
   * @private
   */
  this.cur_ = {
    importer: null,
    listener: null,
    timeout: null
  };

  /**
   * @type {plugin.file.zip.ZIPParserConfig}
   * @private
   */
  this.config_ = /** @type {plugin.file.zip.ZIPParserConfig} */ ($scope['config']);

  /**
   * @type {Array.<Object>|null}
   */
  this['files'] = this.config_['files'];

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {boolean}
   */
  this['valid'] = false;

  /**
   * @type {number}
   */
  this['wait'] = 0;

  this.validate_();
};
goog.inherits(plugin.file.zip.ui.ZIPImportCtrl, os.ui.file.FileImportCtrl);


/**
 * @export
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.finish = function() {
  var entries = this['files'];

  if (!entries) {
    var msg = 'No files selected to import from ZIP';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    return;
  }

  this.importers_ = [];
  var unsupported = {};

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.enabled === true) {
      var file = entry.file;
      var type = file.getType();
      var ui = this.im_.getImportUI(type);
      if (ui) this.importers_.push({'file': file, 'ui': ui});
      else unsupported[type] = true; // store the filetype to report to user later
    }
  }

  var keys = Object.keys(unsupported);

  if (keys && keys.length > 0) {
    var err = 'Unsupported filetype(s).<br />' + keys.join(', ');
    os.alert.AlertManager.getInstance().sendAlert(err, os.alert.AlertEventSeverity.ERROR);
  }

  // either close after the chain completes, or close since there is no chain
  if (this.importers_ && this.importers_.length > 0) this.chain();
  else this.close(); // for now, close this and rely on the chain; possible future improvement: use slickgrid and show import status
};


/**
 * Kick off the import of an unzipped file
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.chain = function() {
  if (typeof this.importers_ == 'undefined' || this.importers_ == null || this.importers_.length == 0) {
    if (typeof this.cur_.listener == 'function') this.cur_.listener(); // kill the listener that was created by the previous chain()
    this.close();
    return;
  }

  var onSuccess = function(im) {
    // TODO if there are other paths through importers in the future, then update this code
    //
    // file successfully read and importer kicked off... so one of two things happened:
    // 1. asycnhronous window process kicked off...
    // 2. assume the importer just did some processing then finished; so chain()
    this.cur_.listener = this.scope_.$root.$on(os.ui.WindowEventType.OPEN, this.onWindowOpen_.bind(this));

    var wait = 1350;
    this.cur_.timeout = this.timeout__(this.onWindowTimeout_.bind(this), wait);
  };

  var onFailure = function() {
    this.chain(); // continue
  };

  this.cur_.importer = this.importers_.splice(0, 1)[0]; // remove the current importer from the queue
  
  var process = new os.im.ImportProcess(); // new os.ui.im.DuplicateImportProcess();
  process.setSkipDuplicates(true);
  process.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, this.cur_.importer['file']));

  // TODO because the duplicate dialog is created by setEvent(), the deferred is not called when 
  // the Duplicate dialog is cancelled... so just use ImportProcess for now
  var deferred = process.begin();
  deferred.then(onSuccess, onFailure, this); // called back when import process starts or fails...
};


/**
 * 
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.windowMatches = function(event) {
  var filename = (this.cur_.importer
    && this.cur_.importer.file
    && typeof this.cur_.importer.file.getFileName == 'function')
      ? this.cur_.importer.file.getFileName()
      : '';
  var config = (event && event.targetScope) ? event.targetScope.config : null;
  
  return (config
    && config.file
    && typeof config.file.getFileName == 'function'
    && config.file.getFileName() == filename);
};


/**
 * 
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onWindowOpen_ = function(event) {

  // if the window scope has the expected file, then listen to that scope for window CLOSE
  if (this.windowMatches(event)) {
    if (this.cur_.timeout) this.timeout__.cancel(this.cur_.timeout); // kill the timeout
    if (typeof this.cur_.listener == 'function') this.cur_.listener(); // kill the listener that was created by the previous chain()

    this.cur_.listener = event.targetScope.$on(os.ui.WindowEventType.CLOSE, function(event){
      // because this is listening to the event.targetScope, this is definitely the window with the expected file, so chain
      this.chain();
    }.bind(this));
  }
};


/**
 * 
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onWindowTimeout_ = function() {
  if (typeof this.cur_.listener == 'function') this.cur_.listener(); // kill the listener that was created by the previous chain()

  // assume that the importer ran a background process that succeeded or failed without user input
  this.chain();
};

/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onDestroy_ = function() {
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'onDestroy_');

  this.timeout__ = null;
  this.config_ = null;
  this.importers_ = null;
  this.files = null;
  this.loading = null;
  this.valid = null;
  this.wait = null;
};


/**
 * Checks if files have been chosen/validated.
 *
 * @private
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.validate_ = function() {
  var wait = 750;
  var maxWait = 80 * wait;

  if (!this.config_) return;

  var status = this.config_['status'];

  this['loading'] = status != 0;
  this['valid'] = !this['loading'];

  // this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this['valid']);

  if (status == 1) {
    if (this['wait'] < maxWait) this.timeout__(this.validate_.bind(this), wait);
    else {
      this['loading'] = false;
      var err = 'Unzipping took too long in browser.  Try unzipping locally first.';
      os.alert.AlertManager.getInstance().sendAlert(err, os.alert.AlertEventSeverity.ERROR);
    }
    this['wait'] += wait;
  }

  // os.ui.apply(this.scope_);
};


/**
 * Returns a count of the number of "selected" files for the UI
 * @return {number}
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.count = function() {
  return (this['files'] && this['files'].length > 0)
    ? this['files'].reduce(
      function(count, file) {
        return file.enabled ? count + 1 : count, 0; // the , 0 at the end of this line initializes the accumulator
      }
    )
    : 0;
};
