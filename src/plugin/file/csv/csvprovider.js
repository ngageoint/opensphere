goog.provide('plugin.file.csv.CSVProvider');
goog.require('os.data.FileProvider');



/**
 * CSV file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.csv.CSVProvider = function() {
  plugin.file.csv.CSVProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.csv.CSVProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.csv.CSVProvider);


/**
 * @inheritDoc
 */
plugin.file.csv.CSVProvider.prototype.configure = function(config) {
  plugin.file.csv.CSVProvider.base(this, 'configure', config);
  this.setId('csv');
  this.setLabel('CSV Files');
};
