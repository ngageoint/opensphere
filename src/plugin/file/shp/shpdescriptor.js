goog.provide('plugin.file.shp.SHPDescriptor');
goog.require('os.data.FileDescriptor');
goog.require('os.file.FileStorage');
goog.require('os.layer.LayerType');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.SHPProvider');



/**
 * SHP file descriptor.
 * @param {plugin.file.shp.SHPParserConfig=} opt_config
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.shp.SHPDescriptor = function(opt_config) {
  plugin.file.shp.SHPDescriptor.base(this, 'constructor');
  this.descriptorType = 'shp';
  this.parserConfig = opt_config || new plugin.file.shp.SHPParserConfig();

  /**
   * @type {?string}
   * @private
   */
  this.originalUrl2_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.url2_ = null;
};
goog.inherits(plugin.file.shp.SHPDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.file.shp.SHPDescriptor.base(this, 'getLayerOptions');
  options['type'] = 'SHP';
  options['originalUrl2'] = this.getOriginalUrl2();
  options['url2'] = this.getUrl2();
  return options;
};


/**
 * Get the original URL for this file.
 * @return {?string}
 */
plugin.file.shp.SHPDescriptor.prototype.getOriginalUrl2 = function() {
  return this.originalUrl2_;
};


/**
 * Set the original URL for this file.
 * @param {?string} value
 */
plugin.file.shp.SHPDescriptor.prototype.setOriginalUrl2 = function(value) {
  this.originalUrl2_ = value;
};


/**
 * Get the URL for this descriptor.
 * @return {?string}
 */
plugin.file.shp.SHPDescriptor.prototype.getUrl2 = function() {
  return this.url2_;
};


/**
 * Set the URL for this descriptor.
 * @param {?string} value
 */
plugin.file.shp.SHPDescriptor.prototype.setUrl2 = function(value) {
  this.url2_ = value;
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.matchesURL = function(url) {
  return url == this.getUrl() || url == this.getUrl2();
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.clearData = function() {
  plugin.file.shp.SHPDescriptor.base(this, 'clearData');

  var url2 = this.getUrl2();
  if (url2 && os.file.isLocal(url2)) {
    var fs = os.file.FileStorage.getInstance();
    fs.deleteFile(url2);
  }
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['originalUrl2'] = this.getOriginalUrl2();
  opt_obj['url2'] = this.getUrl2();

  return plugin.file.shp.SHPDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPDescriptor.prototype.restore = function(conf) {
  this.setOriginalUrl2(conf['originalUrl2'] || null);
  this.setUrl2(conf['url2'] || null);

  plugin.file.shp.SHPDescriptor.base(this, 'restore', conf);
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!plugin.file.shp.SHPParserConfig} config
 * @return {!plugin.file.shp.SHPDescriptor}
 */
plugin.file.shp.SHPDescriptor.createFromConfig = function(config) {
  // use the ZIP file first, SHP second. the import UI uses the extracted files for easier (synchronous) processing
  // but the ZIP should be used for parsing data with the importer. ignore the DBF if we have a zip file.
  var file = config['zipFile'] || config['file'];
  var file2 = config['zipFile'] ? null : config['file2'];
  var provider = plugin.file.shp.SHPProvider.getInstance();
  var descriptor = new plugin.file.shp.SHPDescriptor(config);
  descriptor.setId(provider.getUniqueId());
  descriptor.setProvider(provider.getLabel());
  descriptor.setUrl(file.getUrl());

  if (file2) {
    descriptor.setUrl2(file2.getUrl());
  }

  plugin.file.shp.SHPDescriptor.updateFromConfig(descriptor, config);

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!plugin.file.shp.SHPDescriptor} descriptor
 * @param {!plugin.file.shp.SHPParserConfig} config
 */
plugin.file.shp.SHPDescriptor.updateFromConfig = function(descriptor, config) {
  descriptor.setColor(config['color']);
  descriptor.setDescription(config['description']);
  descriptor.setTitle(config['title']);
  descriptor.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
  descriptor.setParserConfig(config);
};
