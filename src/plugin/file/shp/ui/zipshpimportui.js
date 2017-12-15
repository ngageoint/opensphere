goog.provide('plugin.file.shp.ui.ZipSHPImportUI');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.OptionsStep');
goog.require('os.ui.wiz.step.TimeStep');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.type.DBFTypeMethod');
goog.require('plugin.file.shp.type.SHPTypeMethod');
goog.require('plugin.file.shp.ui.shpImportDirective');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.shp.SHPParserConfig>}
 * @constructor
 */
plugin.file.shp.ui.ZipSHPImportUI = function() {
  /**
   * @type {os.file.File}
   * @private
   */
  this.shpFile_ = null;

  /**
   * @type {os.file.File}
   * @private
   */
  this.dbfFile_ = null;

  /**
   * @type {os.file.File}
   * @private
   */
  this.zipFile_ = null;

  /**
   * @type {plugin.file.shp.SHPParserConfig}
   * @private
   */
  this.config_ = null;
};
goog.inherits(plugin.file.shp.ui.ZipSHPImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.shp.ui.ZipSHPImportUI.prototype.launchUI = function(file, opt_config) {
  this.shpFile_ = null;
  this.dbfFile_ = null;
  this.zipFile_ = file;

  if (goog.isDef(opt_config)) {
    this.config_ = opt_config;
  }

  var content = /** @type {ArrayBuffer} */ (file.getContent());
  zip.createReader(new zip.ArrayBufferReader(content), goog.bind(function(reader) {
    // get the entries in the zip file, then launch the UI
    reader.getEntries(this.processEntries_.bind(this));
  }, this), function() {
    // failed reading the zip file
    var msg = 'Error reading zip file "' + file.getFileName() + '"!';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  });
};


/**
 * @param {Array.<!zip.Entry>} entries
 * @private
 */
plugin.file.shp.ui.ZipSHPImportUI.prototype.processEntries_ = function(entries) {
  for (var i = 0, n = entries.length; i < n; i++) {
    var entry = entries[i];
    if (entry.filename.match(plugin.file.shp.type.SHPTypeMethod.EXT_REGEXP) ||
        entry.filename.match(plugin.file.shp.type.DBFTypeMethod.EXT_REGEXP)) {
      // if the entry is a shp or dbf, load the content and process it
      entry.getData(new zip.ArrayBufferWriter(), this.processEntry_.bind(this, entry));
    }
  }
};


/**
 * @param {zip.Entry} entry
 * @param {*} content
 * @private
 */
plugin.file.shp.ui.ZipSHPImportUI.prototype.processEntry_ = function(entry, content) {
  if (content instanceof ArrayBuffer) {
    // only use the first file encountered, which means archives with multiple shapefiles will only load the first
    content = /** @type {!ArrayBuffer} */ (content);
    if (!this.shpFile_ && entry.filename.match(plugin.file.shp.type.SHPTypeMethod.EXT_REGEXP)) {
      this.shpFile_ =
          os.file.createFromContent(entry.filename, os.file.getLocalUrl(entry.filename), undefined, content);
    } else if (!this.dbfFile_ && entry.filename.match(plugin.file.shp.type.DBFTypeMethod.EXT_REGEXP)) {
      this.dbfFile_ =
          os.file.createFromContent(entry.filename, os.file.getLocalUrl(entry.filename), undefined, content);
    }
  }

  if (this.shpFile_ && this.dbfFile_) {
    this.launchUIInternal_();
  }
};


/**
 * @private
 */
plugin.file.shp.ui.ZipSHPImportUI.prototype.launchUIInternal_ = function() {
  if (this.shpFile_ && this.dbfFile_) {
    var steps = [
      new os.ui.wiz.step.TimeStep(),
      new os.ui.wiz.OptionsStep()
    ];

    var config = new plugin.file.shp.SHPParserConfig();

    // if a configuration was provided, merge it in
    if (this.config_) {
      this.mergeConfig(this.config_, config);
      this.config_ = null;
    }

    config['file'] = this.shpFile_;
    config['file2'] = this.dbfFile_;
    config['zipFile'] = this.zipFile_;
    config['title'] = this.zipFile_.getFileName();

    // generate preview data from the config and try to auto detect mappings
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

    var scopeOptions = {
      'config': config,
      'steps': steps
    };
    var windowOptions = {
      'label': 'SHP Import',
      'icon': 'fa fa-sign-in lt-blue-icon',
      'x': 'center',
      'y': 'center',
      'width': '850',
      'min-width': '500',
      'max-width': '1200',
      'height': '650',
      'min-height': '300',
      'max-height': '1000',
      'modal': 'true',
      'show-close': 'true',
      'no-scroll': 'true'
    };
    var template = '<shpimport resize-with=".window"></shpimport>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  } else {
    var msg = 'Zip file does not contain both SHP and DBF files!';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }

  // drop file references once the UI is launched
  this.shpFile_ = null;
  this.dbfFile_ = null;
  this.zipFile_ = null;
};
