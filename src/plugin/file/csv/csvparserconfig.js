goog.provide('plugin.file.csv.CSVParserConfig');
goog.require('ol.Feature');
goog.require('os.parse.csv.CsvParserConfig');
goog.require('os.ui.slick.column');
goog.require('plugin.file.csv.CSVParser');



/**
 * Configuration for a CSV parser.
 * @extends {os.parse.csv.CsvParserConfig.<ol.Feature>}
 * @constructor
 */
plugin.file.csv.CSVParserConfig = function() {
  plugin.file.csv.CSVParserConfig.base(this, 'constructor');
};
goog.inherits(plugin.file.csv.CSVParserConfig, os.parse.csv.CsvParserConfig);


/**
 * @inheritDoc
 */
plugin.file.csv.CSVParserConfig.prototype.updatePreview = function(opt_mappings) {
  var parser = new plugin.file.csv.CSVParser(this);
  var features = parser.parsePreview(this['file'].getContent(), opt_mappings);

  this['preview'] = features || [];
  this['columns'] = parser.getColumns() || [];

  for (var i = 0, n = this['columns'].length; i < n; i++) {
    var column = this['columns'][i];
    column['width'] = 0;
    os.ui.slick.column.autoSizeColumn(column);
  }

  parser.dispose();
};
