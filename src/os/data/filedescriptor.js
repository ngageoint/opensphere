goog.provide('os.data.FileDescriptor');

goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.data.IReimport');
goog.require('os.data.IUrlDescriptor');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.file.FileStorage');
goog.require('os.im.ImportProcess');
goog.require('os.implements');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.file.ui.defaultFileNodeUIDirective');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');



/**
 * An abstract {@link os.data.IDataDescriptor} implementation that is intended to be used by the various filetype
 * providers (KML, CSV, etc.).
 *
 * @extends {os.data.LayerSyncDescriptor}
 * @implements {os.data.IUrlDescriptor}
 * @implements {os.data.IReimport}
 *
 * @constructor
 */
os.data.FileDescriptor = function() {
  os.data.FileDescriptor.base(this, 'constructor');

  /**
   * @type {?string}
   * @private
   */
  this.originalUrl_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.url_ = null;

  /**
   * @type {os.parse.FileParserConfig}
   * @protected
   */
  this.parserConfig = new os.parse.FileParserConfig();

  /**
   * @type {?osx.icon.Icon}
   * @private
   */
  this.icon_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.shapeName_ = null;

  /**
   * @type {?Date}
   * @private
   */
  this.date_ = null;

  this.descriptorType = 'file';
};
goog.inherits(os.data.FileDescriptor, os.data.LayerSyncDescriptor);
os.implements(os.data.FileDescriptor, 'os.data.IReimport');
os.implements(os.data.FileDescriptor, os.data.IUrlDescriptor.ID);


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.getSearchType = function() {
  return 'Layer';
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.getIcons = function() {
  return os.ui.Icons.FEATURES;
};


/**
 * @return {?osx.icon.Icon}
 */
os.data.FileDescriptor.prototype.getIcon = function() {
  return this.icon_;
};


/**
 * @return {?string}
 */
os.data.FileDescriptor.prototype.getShapeName = function() {
  return this.shapeName_;
};


/**
 * Get the Date for this descriptor.
 * @return {?Date}
 */
os.data.FileDescriptor.prototype.getDate = function() {
  return this.date_;
};


/**
 * Set the Date for this descriptor.
 * @param {?Date} value
 */
os.data.FileDescriptor.prototype.setDate = function(value) {
  this.date_ = value;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.getNodeUI = function() {
  return '<defaultfilenodeui></defaultfilenodeui>';
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.getLayerOptions = function() {
  var options = {};
  options['id'] = this.getId();

  options['animate'] = true; // TODO: add checkbox to toggle this in import UI
  options['color'] = this.getColor();
  options['icon'] = this.getIcon();
  options['shapeName'] = this.getShapeName();
  options['load'] = true;
  options['originalUrl'] = this.getOriginalUrl();
  options['parserConfig'] = this.parserConfig;
  options['provider'] = this.getProvider();
  options['tags'] = this.getTags();
  options['title'] = this.getTitle();
  options['url'] = this.getUrl();
  options['mappings'] = this.getMappings();
  options['detectColumnTypes'] = true;

  return options;
};


/**
 * Get the column mappings to apply to imported data.
 * @return {Array.<os.im.mapping.IMapping>}
 */
os.data.FileDescriptor.prototype.getMappings = function() {
  return this.parserConfig['mappings'];
};


/**
 * Set the column mappings to apply to imported data.
 * @param {Array.<os.im.mapping.IMapping>} value
 */
os.data.FileDescriptor.prototype.setMappings = function(value) {
  this.parserConfig['mappings'] = value;
};


/**
 * Get the original URL for this file.
 * @return {?string}
 */
os.data.FileDescriptor.prototype.getOriginalUrl = function() {
  return this.originalUrl_;
};


/**
 * Set the original URL for this file.
 * @param {?string} value
 */
os.data.FileDescriptor.prototype.setOriginalUrl = function(value) {
  this.originalUrl_ = value;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.matchesURL = function(url) {
  return url == this.getUrl();
};


/**
 * @return {os.parse.FileParserConfig}
 */
os.data.FileDescriptor.prototype.getParserConfig = function() {
  return this.parserConfig;
};


/**
 * @param {os.parse.FileParserConfig} config
 */
os.data.FileDescriptor.prototype.setParserConfig = function(config) {
  this.parserConfig = config;
  this.layerConfig = {};
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.setColor = function(value) {
  this.parserConfig['color'] = value;
  os.data.FileDescriptor.base(this, 'setColor', value);
};


/**
 * @param {!osx.icon.Icon} value
 */
os.data.FileDescriptor.prototype.setIcon = function(value) {
  this.parserConfig['icon'] = value;
  this.icon_ = value;
};


/**
 * @param {?string} value
 */
os.data.FileDescriptor.prototype.setShapeName = function(value) {
  this.parserConfig['shapeName'] = value;
  this.shapeName_ = value;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.setDescription = function(value) {
  this.parserConfig['description'] = value;
  os.data.FileDescriptor.base(this, 'setDescription', value);
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.setTags = function(value) {
  this.parserConfig['tags'] = value ? value.join(', ') : '';
  os.data.FileDescriptor.base(this, 'setTags', value);
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.setTitle = function(value) {
  this.parserConfig['title'] = value;
  os.data.FileDescriptor.base(this, 'setTitle', value);
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.clearData = function() {
  // permanently remove associated file contents from the application/storage
  var url = this.getUrl();
  if (url && os.file.isLocal(url)) {
    var fs = os.file.FileStorage.getInstance();
    fs.deleteFile(url);
  }
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.canReimport = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.reimport = function() {
  var evt = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL, this.getOriginalUrl() || this.getUrl());

  var process = new os.im.ImportProcess();
  process.setEvent(evt);
  process.setConfig(this.getParserConfig());
  process.setSkipDuplicates(true);
  process.begin();
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['originalUrl'] = this.originalUrl_;
  opt_obj['url'] = this.url_;
  opt_obj['icon'] = this.getIcon();
  opt_obj['shapeName'] = this.getShapeName();
  opt_obj['date'] = this.getDate();

  var mappings = this.getMappings();
  if (mappings) {
    var mm = os.im.mapping.MappingManager.getInstance();
    opt_obj['mappings'] = mm.persistMappings(mappings);
  }

  return os.data.FileDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @inheritDoc
 */
os.data.FileDescriptor.prototype.restore = function(conf) {
  this.setOriginalUrl(conf['originalUrl'] || null);
  this.setUrl(conf['url'] || null);
  this.setIcon(conf['icon']);
  this.setShapeName(conf['shapeName']);
  this.setDate(conf['date'] || null);

  if (conf['mappings']) {
    var mm = os.im.mapping.MappingManager.getInstance();
    this.setMappings(mm.restoreMappings(conf['mappings']));
  }

  os.data.FileDescriptor.base(this, 'restore', conf);
  this.updateActiveFromTemp();
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!os.parse.FileParserConfig} config
 * @param {boolean=} opt_isNotParserConfig Set to true to not use the the config as the parser config
 */
os.data.FileDescriptor.prototype.updateFromConfig = function(config, opt_isNotParserConfig) {
  this.setDescription(config['description']);
  this.setColor(config['color']);
  this.setIcon(config['icon']);
  this.setShapeName(config['shapeName']);
  this.setTitle(config['title']);
  this.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
  this.setDate(config['date']);
  if (!opt_isNotParserConfig) {
    this.setParserConfig(config);
  }
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!os.data.FileDescriptor} descriptor
 * @param {!os.data.FileProvider} provider
 * @param {!os.parse.FileParserConfig} config
 * @param {?string=} opt_useDefaultColor
 */
os.data.FileDescriptor.createFromConfig = function(descriptor, provider, config, opt_useDefaultColor) {
  var file = config['file'];
  descriptor.setId(provider.getUniqueId());
  descriptor.setProvider(provider.getLabel());
  if (file) {
    descriptor.setUrl(file.getUrl());
  }
  if (opt_useDefaultColor) {
    descriptor.setColor(os.style.DEFAULT_LAYER_COLOR);
  }
  descriptor.updateFromConfig(config);
};
