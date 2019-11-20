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
goog.require('plugin.file.zip.ZIPParser');


/**
 * @typedef {{
 *   file: os.file.File,
 *   ui: os.ui.im.IImportUI
 * }}
 */
plugin.file.zip.ImporterPair;


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
   * @type {!Array<plugin.file.zip.ImporterPair>|null}
   * @private
   */
  this.importers_;

  /**
   * Group of objects related to each step in the chain of importers
   *
   * @type {plugin.file.zip.ImporterPair|null}
   * @private
   */
  this.curImporter_ = null;

  /**
   * Group of objects related to each step in the chain of importers
   *
   * @type {function()|null}
   * @private
   */
  this.curListener_ = null;

  /**
   * Group of objects related to each step in the chain of importers
   *
   * @type {angular.$q.Promise|null}
   * @private
   */
  this.curTimeout_ = null;

  /**
   * @type {plugin.file.zip.ZIPParserConfig}
   * @private
   */
  this.config_ = /** @type {plugin.file.zip.ZIPParserConfig} */ ($scope['config']);

  /**
   * @type {number}
   * @private
   */
  this.wait_ = 0;

  /**
   * @type {Array.<osx.import.FileWrapper>|null}
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

  this.init_();
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
      if (ui) {
        var importer = /** @type plugin.file.zip.ImporterPair */ ({file, ui});
        this.importers_.push(importer);
      } else unsupported[type] = true; // store the filetype to report to user later
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
    if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()
    this.close();
    return;
  }

  var onSuccess = function() {
    // TODO if there are other paths through importers in the future, then update this code
    //
    // file successfully read and importer kicked off... so one of two things happened:
    // 1. asycnhronous window process kicked off...
    // 2. assume the importer just did some processing then finished; so chain()
    this.curListener_ = this.scope_.$root.$on(os.ui.WindowEventType.OPEN, this.onWindowOpen_.bind(this));

    var wait = 1350;
    this.curTimeout_ = this.timeout__(this.onWindowTimeout_.bind(this), wait);
  };

  var onFailure = function() {
    this.chain(); // continue
  };

  this.curImporter_ = this.importers_.splice(0, 1)[0]; // remove the current importer from the queue

  // TODO - Breaking Change -- Fix every place that uses DuplicateImportProcess to utilize events OR alter DuplicateImportProcess
  // to handle the deferred object in all cases (without breaking any of the current uses).  Currently, the duplicate
  // dialog is created by setEvent(), so the deferred is not called when that dialog is cancelled.  So for now, we
  // have to use ImportProcess instead of DuplicateImportProcess here.
  var process = new os.im.ImportProcess();
  process.setSkipDuplicates(true);
  process.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, this.curImporter_['file']));

  var deferred = process.begin();
  deferred.then(onSuccess, onFailure, this); // called back when import process starts or fails...
};


/**
 * Checks to see if the window created is an ImporterUI with the expected file
 *
 * @param {angular.Scope.Event} event
 * @return {boolean}
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.windowMatches = function(event) {
  var filename = (this.curImporter_.file) ? this.curImporter_.file.getFileName() : '';
  var config = (event && event.targetScope) ? event.targetScope.config : null;

  return (config
    && config.file
    && config.file.getFileName() == filename);
};


/**
 * Handles the generic listener for any window events
 *
 * @param {angular.Scope.Event} event
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onWindowOpen_ = function(event) {
  // if the window scope has the expected file, then listen to that scope for window CLOSE
  if (this.windowMatches(event)) {
    if (this.curTimeout_) this.timeout__.cancel(this.curTimeout_); // kill the timeout
    if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()

    // because this is listening to the event.targetScope, this is definitely the window with
    // the expected file, so simply chain
    this.curListener_ = event.targetScope.$on(os.ui.WindowEventType.CLOSE, this.chain.bind(this));
  }
};


/**
 * Handles calling he next chain() when an Importer is a background run (doesn't create a window)
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onWindowTimeout_ = function() {
  if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()

  // assume that the importer ran a background process that succeeded or failed without user input
  this.chain();
};

/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onDestroy = function() {
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'onDestroy');

  this.timeout__ = null;
  this.config_ = null;
  this.importers_ = null;
  this.curImporter_ = null;
  this.curListener_ = null;
  this.curTimeout_ = null;
  this.files = null;
  this.loading = null;
  this.valid = null;
  this.wait_ = 0;
};


/**
 * Starts the unzip process...
 *
 * @private
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.init_ = function() {
  // wait for the unzip to finish, or timeout
  this.validate_();

  this.parser_ = new plugin.file.zip.ZIPParser(this.config_);
  this.parser_.unzip();
};


/**
 * @param {string=} msg
 * @private
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onError_ = function(msg) {
  this['loading'] = false;
  this['valid'] = false;

  this.config_.cleanup(); // clean up the config
  this.parser_.dispose(); // clean up the unzipper

  if (msg) os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};


/**
 * Checks if files have been chosen/validated.
 *
 * @private
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.validate_ = function() {
  var wait = 750;
  var maxWait = 30 * wait; // 22.5 seconds

  if (!this.config_) return;

  var status = this.config_['status'];
  var loading = (status == -1 || status == 1); // initializing or parsing

  this['loading'] = loading;
  this['valid'] = !loading;

  if (loading) {
    if (this.wait_ < maxWait) this.timeout__(this.validate_.bind(this), wait);
    else {
      this.onError_('Unzipping file took too long in browser.  Try unzipping locally first.');
    }
    this.wait_ += wait;
  } else if (status == -2) {
    this.onError_('Failed to unzip file in browser.  Try unzipping it locally first.');
  }
};


/**
 * Returns a count of the number of "selected" files for the UI
 * @return {number}
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.count = function() {
  return (this['files'])
    ? this['files'].reduce(
        (count, file) => file.enabled ? count + 1 : count,
        0 // this optional reduce() param initializes the accumulator
    )
    : 0;
};
