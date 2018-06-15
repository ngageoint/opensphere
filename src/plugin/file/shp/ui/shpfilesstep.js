goog.provide('plugin.file.shp.ui.SHPFilesStep');
goog.provide('plugin.file.shp.ui.SHPFilesStepCtrl');

goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.ui.Module');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('os.ui.wiz.wizardPreviewDirective');
goog.require('plugin.file.shp');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.type.DBFTypeMethod');
goog.require('plugin.file.shp.type.SHPTypeMethod');



/**
 * SHP import file selection step
 * @extends {os.ui.wiz.step.AbstractWizardStep.<plugin.file.shp.SHPParserConfig>}
 * @constructor
 */
plugin.file.shp.ui.SHPFilesStep = function() {
  plugin.file.shp.ui.SHPFilesStep.base(this, 'constructor');
  this.template = '<shpfilesstep></shpfilesstep>';
  this.title = 'Files';
};
goog.inherits(plugin.file.shp.ui.SHPFilesStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
plugin.file.shp.ui.SHPFilesStep.prototype.finalize = function(config) {
  try {
    config.updatePreview();

    var features = config['preview'];
    if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
      // no mappings have been set yet, so try to auto detect them
      var mm = os.im.mapping.MappingManager.getInstance();
      var mappings = mm.autoDetect(features);
      if (mappings && mappings.length > 0) {
        config['mappings'] = mappings;
      }
    }
  } catch (e) {
  }
};


/**
 * The SHP import file selection step directive
 * @return {angular.Directive}
 */
plugin.file.shp.ui.configStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/shp/shpfilesstep.html',
    controller: plugin.file.shp.ui.SHPFilesStepCtrl,
    controllerAs: 'filesStep'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('shpfilesstep', [plugin.file.shp.ui.configStepDirective]);



/**
 * Controller for the SHP import file selection step
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.file.shp.ui.SHPFilesStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {plugin.file.shp.SHPParserConfig}
   * @private
   */
  this.config_ = /** @type {plugin.file.shp.SHPParserConfig} */ ($scope['config']);

  /**
   * @type {Element}
   * @private
   */
  this.dbfFileEl_ = document.getElementById('dbfFile');
  goog.events.listen(this.dbfFileEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);

  /**
   * @type {Element}
   * @private
   */
  this.shpFileEl_ = document.getElementById('shpFile');
  goog.events.listen(this.shpFileEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {string}
   */
  this['dbfName'] = this.getDisplayName_(this.config_['file2']);

  /**
   * @type {boolean}
   */
  this['dbfValid'] = !!this['dbfName'];

  /**
   * @type {?string}
   */
  this['dbfError'] = null;

  /**
   * @type {string}
   */
  this['shpName'] = this.getDisplayName_(this.config_['file']);

  /**
   * @type {boolean}
   */
  this['shpValid'] = !!this['shpName'];

  /**
   * @type {?string}
   */
  this['shpError'] = null;

  $scope.$on('$destroy', this.destroy_.bind(this));

  this.updateErrorText_('shp');
  this.updateErrorText_('dbf');
  this.validate_();
};


/**
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.destroy_ = function() {
  goog.events.unlisten(this.dbfFileEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);
  goog.events.unlisten(this.shpFileEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);
  this.dbfFileEl_ = null;
  this.shpFileEl_ = null;
  this.config_ = null;
  this.scope_ = null;
};


/**
 * Checks if both files have been chosen/validated.
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.validate_ = function() {
  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this['dbfValid'] && this['shpValid']);
  os.ui.apply(this.scope_);
};


/**
 * Launches a file browser for the specified file type.
 * @param {string} type The file type
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onBrowse = function(type) {
  if (type == 'dbf' && this.dbfFileEl_) {
    this.dbfFileEl_.click();
  } else if (type == 'shp' && this.shpFileEl_) {
    this.shpFileEl_.click();
  }
};
goog.exportProperty(
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype,
    'onBrowse',
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onBrowse);


/**
 * Handles changes to the hidden file inputs, validating the chosen file.
 * @param {goog.events.BrowserEvent} event
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onFileChange_ = function(event) {
  var inputEl = /** @type {HTMLInputElement} */ (event.target);
  var type = inputEl == this.dbfFileEl_ ? 'dbf' : 'shp';
  if (inputEl.files && inputEl.files.length > 0) {
    this['loading'] = true;

    var reader = os.file.createFromFile(inputEl.files[0]);
    reader.addCallbacks(goog.partial(this.handleResult_, type), goog.partial(this.handleError_, type), this);
  } else {
    this.onClear(type);
  }
};


/**
 * Handler for successful file read.
 * @param {string} type The file type
 * @param {os.file.File} file The file.
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.handleResult_ = function(type, file) {
  this['loading'] = false;

  if (file) {
    // make sure the file is given a unique name, unless this is a replace
    if (!this.config_['descriptor']) {
      os.file.FileStorage.getInstance().setUniqueFileName(file);
    }

    var method = type == 'dbf' ? new plugin.file.shp.type.DBFTypeMethod() : new plugin.file.shp.type.SHPTypeMethod();
    if (method.isType(file)) {
      if (type == 'dbf') {
        this.config_['file2'] = file;
      } else {
        this.config_['file'] = file;
      }

      this[type + 'Name'] = this.getDisplayName_(file);
      this[type + 'Valid'] = true;
    } else {
      this[type + 'Valid'] = false;
    }
  }

  this.updateErrorText_(type);
  this.validate_();
};


/**
 * Updates the error text displayed for the SHP/DBF file based on the UI state.
 * @param {string} type The file type
 * @param {string=} opt_text Custom error text
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.updateErrorText_ = function(type, opt_text) {
  if (!this[type + 'Valid']) {
    if (opt_text) {
      this[type + 'Error'] = opt_text;
    } else if (this[type + 'Name']) {
      this[type + 'Error'] = 'Selected file is not ' + this.getTypeString_(type) + '.';
    } else {
      this[type + 'Error'] = 'Please choose ' + this.getTypeString_(type) + '.';
    }
  } else {
    this[type + 'Error'] = null;
  }
};


/**
 * Gets the user-facing name for the provided file. Remote files will return the URL, while local files will return
 * the file name.
 * @param {?os.file.File} file The file
 * @return {string}
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.getDisplayName_ = function(file) {
  if (!file) {
    return '';
  }

  var url = file.getUrl();
  if (url && !os.file.isLocal(url)) {
    return url;
  }

  return file.getFileName() || '';
};


/**
 * Handler for failed file read. Display an error message and close the window.
 * @param {string} type The file type
 * @param {string} errorMsg The error message.
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.handleError_ = function(type, errorMsg) {
  this['loading'] = false;

  var file = type + 'File';
  if (!errorMsg || !goog.isString(errorMsg)) {
    var fileName = this.scope_[file] ? this.scope_[file].name : 'unknown';
    errorMsg = 'Unable to load file "' + fileName + '".';
  }

  this[type + 'Valid'] = false;
  this.updateErrorText_(type, errorMsg);
  this.validate_();

  goog.log.error(plugin.file.shp.ui.SHPFilesStepCtrl.LOGGER_, errorMsg);
};


/**
 * Clears the file associated with the specified type.
 * @param {string} type The file type
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onClear = function(type) {
  if (type == 'dbf') {
    this.config_['file2'] = null;
    this.dbfFileEl_.value = null;
  } else {
    this.config_['file'] = null;
    this.shpFileEl_.value = null;
  }

  this[type + 'Name'] = '';
  this[type + 'Valid'] = false;

  this.updateErrorText_(type);
  this.validate_();
};
goog.exportProperty(
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype,
    'onClear',
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onClear);


/**
 * Convenience function for returning 'a DBF file' or 'an SHP file' for error messages. I know, it's best
 * not to ask.
 * @param {string} type
 * @return {string}
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.getTypeString_ = function(type) {
  return 'a' + (type == 'shp' ? 'n ' : ' ') + type.toUpperCase() + ' file';
};


/**
 * Loads the provided URL to see if it's a valid SHP/DBF file.
 * @param {string} type The file type
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.loadUrl = function(type) {
  var method = new os.ui.file.method.UrlMethod();
  var url = this[type + 'Name'];
  method.setUrl(url);
  method.listen(os.events.EventType.COMPLETE, goog.partial(this.onUrlComplete_, type), false, this);
  method.listen(os.events.EventType.CANCEL, goog.partial(this.onUrlError_, type), false, this);
  method.loadUrl();
};
goog.exportProperty(
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype,
    'loadUrl',
    plugin.file.shp.ui.SHPFilesStepCtrl.prototype.loadUrl);


/**
 * Handles URL import completion.
 * @param {string} type
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onUrlComplete_ = function(type, event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  method.removeAllListeners();

  var file = method.getFile();
  if (file) {
    this.handleResult_(type, file);
  } else {
    this.handleError_(type, 'Unable to load URL!');
  }
};


/**
 * Handles URL import error.
 * @param {string} type
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.shp.ui.SHPFilesStepCtrl.prototype.onUrlError_ = function(type, event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  method.removeAllListeners();

  this.handleError_(type, 'Unable to load URL!');
};
