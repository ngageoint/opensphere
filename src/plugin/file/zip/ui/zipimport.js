goog.declareModuleId('plugin.file.zip.ui.ZIPImport');

import AlertEventSeverity from '../../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../../os/alert/alertmanager.js';
import ImportProcess from '../../../../os/im/importprocess.js';
import {ROOT} from '../../../../os/os.js';
import {Controller as FileImportCtrl} from '../../../../os/ui/file/fileimport.js';
import ImportEvent from '../../../../os/ui/im/importevent.js';
import ImportEventType from '../../../../os/ui/im/importeventtype.js';
import ImportManager from '../../../../os/ui/im/importmanager.js';
import Module from '../../../../os/ui/module.js';
import WindowEventType from '../../../../os/ui/windoweventtype.js';
import ZIPParser from '../zipparser.js';


/**
 * @typedef {{
 *   file: OSFile,
 *   ui: IImportUI
 * }}
 */
let ImporterPair;


/**
 * The ZIP import directive; use the Wizard Directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/zip/zipimport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'zipimport';

Module.directive('zipimport', [directive]);


/**
 * Controller for the ZIP import dialog
 * @unrestricted
 */
export class Controller extends FileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
    super($scope, $element, $timeout);

    /**
     * @type {angular.$timeout|null}
     * @private
     */
    this.timeout__ = $timeout;

    /**
     * @type {ImportManager}
     * @private
     */
    this.im_ = ImportManager.getInstance();

    /**
     * @type {!Array<ImporterPair>|null}
     * @private
     */
    this.importers_;

    /**
     * Group of objects related to each step in the chain of importers
     *
     * @type {ImporterPair|null}
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
     * @type {ZIPParserConfig}
     * @private
     */
    this.config_ = /** @type {ZIPParserConfig} */ ($scope['config']);

    /**
     * @type {number}
     * @private
     */
    this.wait_ = 0;

    /**
     * @type {Array<FileWrapper>|null}
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
  }

  /**
   * @export
   */
  finish() {
    var entries = this['files'];

    if (!entries) {
      var msg = 'No files selected to import from ZIP';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
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
          var importer = /** @type ImporterPair */ ({file, ui});
          this.importers_.push(importer);
        } else unsupported[type] = true; // store the filetype to report to user later
      }
    }

    var keys = Object.keys(unsupported);

    if (keys && keys.length > 0) {
      var err = 'Unsupported filetype(s)<br />' + keys.join(', ');
      AlertManager.getInstance().sendAlert(err, AlertEventSeverity.ERROR);
    }

    // either close after the chain completes, or close since there is no chain
    if (this.importers_ && this.importers_.length > 0) this.chain();
    else this.close(); // for now, close this and rely on the chain; possible future improvement: use slickgrid and show import status
  }

  /**
   * Kick off the import of an unzipped file
   */
  chain() {
    if (typeof this.importers_ == 'undefined' || this.importers_ == null || this.importers_.length == 0) {
      if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()
      this.close();
      return;
    }

    var onSuccess = function() {
      // file successfully read and importer kicked off... so one of two things happened:
      // 1. asycnhronous window process kicked off...
      // 2. assume the importer just did some processing then finished; so chain()
      this.curListener_ = this.scope_.$root.$on(WindowEventType.OPEN, this.onWindowOpen_.bind(this));

      var wait = 1350;
      this.curTimeout_ = this.timeout__(this.onWindowTimeout_.bind(this), wait);
    };

    var onFailure = function() {
      this.chain(); // continue
    };

    this.curImporter_ = this.importers_.splice(0, 1)[0]; // remove the current importer from the queue

    // Currently, the duplicate dialog is created by setEvent(), so the deferred is not called when
    // that dialog is canceled.  So for now, use ImportProcess instead of DuplicateImportProcess here
    var process = new ImportProcess();
    process.setSkipDuplicates(true);
    process.setEvent(new ImportEvent(ImportEventType.FILE, this.curImporter_['file']));

    var deferred = process.begin();
    deferred.then(onSuccess, onFailure, this); // called back when import process starts or fails...
  }

  /**
   * Checks to see if the window created is an ImporterUI with the expected file
   *
   * @param {angular.Scope.Event} event
   * @return {boolean}
   */
  windowMatches(event) {
    var filename = (this.curImporter_.file) ? this.curImporter_.file.getFileName() : '';
    var config = (event && event.targetScope) ? event.targetScope.config : null;

    return (config &&
      config.file &&
      config.file.getFileName() == filename);
  }

  /**
   * Handles the generic listener for any window events
   *
   * @param {angular.Scope.Event} event
   */
  onWindowOpen_(event) {
    // if the window scope has the expected file, then listen to that scope for window CLOSE
    if (this.windowMatches(event)) {
      if (this.curTimeout_) this.timeout__.cancel(this.curTimeout_); // kill the timeout
      if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()

      // because this is listening to the event.targetScope, this is definitely the window with
      // the expected file, so simply chain
      this.curListener_ = event.targetScope.$on(WindowEventType.CLOSE, this.chain.bind(this));
    }
  }

  /**
   * Handles calling he next chain() when an Importer is a background run (doesn't create a window)
   */
  onWindowTimeout_() {
    if (this.curListener_) this.curListener_(); // kill the listener that was created by the previous chain()

    // assume that the importer ran a background process that succeeded or failed without user input
    this.chain();
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();

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
  }

  /**
   * Starts the unzip process...
   *
   * @private
   */
  init_() {
    // wait for the unzip to finish, or timeout
    this.validate_();

    this.parser_ = new ZIPParser(this.config_);
    this.parser_.unzip();
  }

  /**
   * @param {string=} msg
   * @private
   */
  onError_(msg) {
    this['loading'] = false;
    this['valid'] = false;

    this.config_.cleanup(); // clean up the config
    this.parser_.dispose(); // clean up the unzipper

    if (msg) AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
  }

  /**
   * Checks if files have been chosen/validated.
   *
   * @private
   */
  validate_() {
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
  }

  /**
   * Returns a count of the number of "selected" files for the UI
   * @return {number}
   */
  count() {
    return (this['files']) ?
      this['files'].reduce(
          (count, file) => file.enabled ? count + 1 : count,
          0 // this optional reduce() param initializes the accumulator
      ) :
      0;
  }
}
