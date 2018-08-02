goog.provide('os.im.ImportProcess');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.parse.FileParserConfig');
goog.require('os.style');
goog.require('os.style.StyleManager');
goog.require('os.ui.im.DuplicateImportProcess');



/**
 * @extends {os.ui.im.DuplicateImportProcess}
 * @constructor
 */
os.im.ImportProcess = function() {
  os.im.ImportProcess.base(this, 'constructor');

  /**
   * @type {boolean}
   * @protected
   */
  this.skipDuplicates = false;
};
goog.inherits(os.im.ImportProcess, os.ui.im.DuplicateImportProcess);


/**
 * @param {boolean} value
 */
os.im.ImportProcess.prototype.setSkipDuplicates = function(value) {
  this.skipDuplicates = value;
};


/**
 * @inheritDoc
 */
os.im.ImportProcess.prototype.onFileExists = function() {
  if (this.skipDuplicates) {
    this.reimport();
  } else {
    os.im.ImportProcess.base(this, 'onFileExists');
  }
};


/**
 * @inheritDoc
 */
os.im.ImportProcess.prototype.onUrlExists = function() {
  if (this.skipDuplicates) {
    this.reimport();
  } else {
    os.im.ImportProcess.base(this, 'onUrlExists');
  }
};


/**
 * @inheritDoc
 */
os.im.ImportProcess.prototype.reimport = function() {
  // keep track of the descriptor so we can update it after import
  var url = /** @type {string} */ (this.file.getUrl());
  var desc = this.getDescriptorByUrl(url);
  var config = new os.parse.FileParserConfig();

  if (desc instanceof os.data.FileDescriptor) {
    desc = /** @type {os.data.FileDescriptor} */ (desc);
    config = /** @type {os.parse.FileParserConfig} */ (desc.getParserConfig());
  }

  config['descriptor'] = desc;
  config['replace'] = true;

  // check for a layer config to get the most recent layer color
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(desc.getId());
  if (layerConfig) {
    config['color'] = os.style.getConfigColor(layerConfig);
  }

  this.importFile(config);
};
