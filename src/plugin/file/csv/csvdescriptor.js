goog.provide('plugin.file.csv.CSVDescriptor');
goog.require('os.data.FileDescriptor');
goog.require('os.layer.LayerType');
goog.require('plugin.file.csv.CSVParserConfig');
goog.require('plugin.file.csv.CSVProvider');



/**
 * CSV file descriptor.
 * @param {plugin.file.csv.CSVParserConfig=} opt_config
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.csv.CSVDescriptor = function(opt_config) {
  plugin.file.csv.CSVDescriptor.base(this, 'constructor');
  this.descriptorType = 'csv';
  this.parserConfig = opt_config || new plugin.file.csv.CSVParserConfig();
};
goog.inherits(plugin.file.csv.CSVDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.csv.CSVDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.file.csv.CSVDescriptor.base(this, 'getLayerOptions');
  options['type'] = 'CSV';
  options['commentChar'] = this.getCommentChar();
  options['dataRow'] = this.getDataRow();
  options['delimiter'] = this.getDelimiter();
  options['headerRow'] = this.getHeaderRow();
  options['useHeader'] = this.getUseHeader();
  return options;
};


/**
 * @return {string}
 */
plugin.file.csv.CSVDescriptor.prototype.getCommentChar = function() {
  return this.parserConfig['commentChar'];
};


/**
 * @param {string} commentChar
 */
plugin.file.csv.CSVDescriptor.prototype.setCommentChar = function(commentChar) {
  this.parserConfig['commentChar'] = commentChar;
};


/**
 * @return {number}
 */
plugin.file.csv.CSVDescriptor.prototype.getDataRow = function() {
  return this.parserConfig['dataRow'];
};


/**
 * @param {number} row
 */
plugin.file.csv.CSVDescriptor.prototype.setDataRow = function(row) {
  this.parserConfig['dataRow'] = row;
};


/**
 * @return {string}
 */
plugin.file.csv.CSVDescriptor.prototype.getDelimiter = function() {
  return this.parserConfig['delimiter'];
};


/**
 * @param {string} delimiter
 */
plugin.file.csv.CSVDescriptor.prototype.setDelimiter = function(delimiter) {
  this.parserConfig['delimiter'] = delimiter;
};


/**
 * @return {number}
 */
plugin.file.csv.CSVDescriptor.prototype.getHeaderRow = function() {
  return this.parserConfig['headerRow'];
};


/**
 * @param {number} row
 */
plugin.file.csv.CSVDescriptor.prototype.setHeaderRow = function(row) {
  this.parserConfig['headerRow'] = row;
};


/**
 * @return {number}
 */
plugin.file.csv.CSVDescriptor.prototype.getUseHeader = function() {
  return this.parserConfig['useHeader'];
};


/**
 * @param {boolean} useHeader
 */
plugin.file.csv.CSVDescriptor.prototype.setUseHeader = function(useHeader) {
  this.parserConfig['useHeader'] = useHeader;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['commentChar'] = this.getCommentChar();
  opt_obj['dataRow'] = this.getDataRow();
  opt_obj['delimiter'] = this.getDelimiter();
  opt_obj['headerRow'] = this.getHeaderRow();
  opt_obj['useHeader'] = this.getUseHeader();

  return plugin.file.csv.CSVDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVDescriptor.prototype.restore = function(conf) {
  this.setCommentChar(conf['commentChar']);
  this.setDataRow(conf['dataRow']);
  this.setDelimiter(conf['delimiter']);
  this.setHeaderRow(conf['headerRow']);
  this.setUseHeader(conf['useHeader']);

  plugin.file.csv.CSVDescriptor.base(this, 'restore', conf);
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!plugin.file.csv.CSVParserConfig} config
 * @return {!plugin.file.csv.CSVDescriptor}
 */
plugin.file.csv.CSVDescriptor.createFromConfig = function(config) {
  var file = config['file'];
  var provider = plugin.file.csv.CSVProvider.getInstance();
  var descriptor = new plugin.file.csv.CSVDescriptor(config);
  descriptor.setId(provider.getUniqueId());
  descriptor.setProvider(provider.getLabel());
  descriptor.setUrl(file.getUrl());

  plugin.file.csv.CSVDescriptor.updateFromConfig(descriptor, config);

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!plugin.file.csv.CSVDescriptor} descriptor
 * @param {!plugin.file.csv.CSVParserConfig} config
 */
plugin.file.csv.CSVDescriptor.updateFromConfig = function(descriptor, config) {
  descriptor.setColor(config['color']);
  descriptor.setDescription(config['description']);
  descriptor.setTitle(config['title']);
  descriptor.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
  descriptor.setParserConfig(config);
};
