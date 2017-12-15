goog.provide('os.ui.file.csv.AbstractCSVExporter');
goog.require('goog.log');
goog.require('os.ex.AbstractExporter');



/**
 * A CSV exporter driven by PapaParse.
 * @extends {os.ex.AbstractExporter.<T>}
 * @constructor
 * @template T
 */
os.ui.file.csv.AbstractCSVExporter = function() {
  os.ui.file.csv.AbstractCSVExporter.base(this, 'constructor');
  this.log = os.ui.file.csv.AbstractCSVExporter.LOGGER_;

  /**
   * Data to pass to PapaParse's unparse function
   * @type {Array.<Object.<string, string>>}
   * @protected
   */
  this.papaItems = [];
};
goog.inherits(os.ui.file.csv.AbstractCSVExporter, os.ex.AbstractExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.csv.AbstractCSVExporter.LOGGER_ = goog.log.getLogger('os.ui.file.csv.AbstractCSVExporter');


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.reset = function() {
  os.ui.file.csv.AbstractCSVExporter.base(this, 'reset');
  this.papaItems.length = 0;
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.getExtension = function() {
  return 'csv';
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.getLabel = function() {
  return 'CSV';
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.getMimeType = function() {
  return 'text/csv';
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.process = function() {
  for (var i = 0, n = this.items.length; i < n; i++) {
    var papaItem = this.processItem(this.items[i]);
    if (papaItem) {
      this.papaItems.push(papaItem);
    }
  }

  if (this.papaItems.length > 0) {
    // prepend the UTF byte order mark so that excel will properly parse it
    this.output = '\ufeff';
    this.output += Papa.unparse(this.papaItems, {
      newline: '\n'
    });
  }
};


/**
 * Process a single item, returning a JSON object for PapaParse.
 * @param {T} item The item
 * @return {Object.<string, string>} The Papa item
 * @protected
 * @template T
 */
os.ui.file.csv.AbstractCSVExporter.prototype.processItem = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCSVExporter.prototype.cancel = function() {};
