goog.provide('os.ui.file.csv.AbstractCsvParser');

goog.require('os.data.ColumnDefinition');
goog.require('os.file.mime.text');
goog.require('os.parse.AsyncParser');
goog.require('os.parse.BaseParserConfig');



/**
 * A CSV parser driven by PapaParse.
 * @param {os.parse.BaseParserConfig} config
 * @extends {os.parse.AsyncParser}
 * @template T
 * @constructor
 */
os.ui.file.csv.AbstractCsvParser = function(config) {
  os.ui.file.csv.AbstractCsvParser.base(this, 'constructor');

  /**
   * @type {Array.<os.data.ColumnDefinition>}
   * @protected
   */
  this.columns = [];

  /**
   * @type {os.parse.BaseParserConfig}
   * @protected
   */
  this.config = config;

  /**
   * @type {!Array.<Object.<string, *>>}
   * @protected
   */
  this.results = [];

  if (!Modernizr.webworkers) {
    // if workers aren't available, reduce Papa's default chunk size to prevent the browser from hanging
    Papa.LocalChunkSize = 1024 * 1024 * 1;  // 1 MB (default 10MB)
    Papa.RemoteChunkSize = 1024 * 1024 * 1;  // 1 MB (default 5MB)
  }
};
goog.inherits(os.ui.file.csv.AbstractCsvParser, os.parse.AsyncParser);


/**
 * @type {number}
 */
os.ui.file.csv.AbstractCsvParser.PREVIEW_SIZE = 1000;


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCsvParser.prototype.cleanup = function() {
  goog.array.clear(this.results);

  if (this.handle_) {
    this.handle_.abort();
    this.handle_ = undefined;
  }
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCsvParser.prototype.disposeInternal = function() {
  this.cleanup();
  this.config = null;
  os.ui.file.csv.AbstractCsvParser.base(this, 'disposeInternal');
};


/**
 * @return {Array.<os.data.ColumnDefinition>}
 */
os.ui.file.csv.AbstractCsvParser.prototype.getColumns = function() {
  return this.columns;
};


/**
 * Handle a partial chunk of processed results.
 * @param {Papa.Results} results
 * @param {Papa.ParserHandle} handle
 * @private
 */
os.ui.file.csv.AbstractCsvParser.prototype.handleChunk_ = function(results, handle) {
  if (results && results.data && results.data.length) {
    this.preprocessResults(results);
    this.results = this.results.concat(results.data);
  }

  this.handle_ = handle;
};


/**
 * Handle the final chunk of processed results.
 * @param {Papa.Results} results
 * @private
 */
os.ui.file.csv.AbstractCsvParser.prototype.handleComplete_ = function(results) {
  if (results && results.data && results.data.length) {
    this.preprocessResults(results);
    this.results = this.results.concat(results.data);
  }

  this.handle_ = undefined;
  this.onReady();
};


/**
 * Processes a single PapaParse result.
 * @protected
 * @param {Object.<string, *>} result The result to process
 * @param {Array.<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features.
 * @return {!T}
 */
os.ui.file.csv.AbstractCsvParser.prototype.processResult = goog.abstractMethod;


/**
 * Updates parser results if the header row wasn't used so the fields are 'Column 0..n' and each result is an object
 * of (column, value) pairs instead of arrays of values. This ensures results are translated to features correctly.
 * @protected
 * @param {Papa.Results} results
 */
os.ui.file.csv.AbstractCsvParser.prototype.preprocessResults = function(results) {
  if (!this.config['useHeader']) {
    results.meta.fields = [];
    for (var i = 0, n = results.data[0].length; i < n; i++) {
      results.meta.fields.push('Column ' + i);
    }

    var i = results.data.length;
    while (i--) {
      var data = results.data[i];
      var newData = {};
      for (var j = 0, k = data.length; j < k; j++) {
        newData['Column ' + j] = data[j];
      }

      results.data[i] = newData;
    }
  }
};


/**
 * Removes extra rows in the provided source using the headerRow and dataRow configuration.
 * @param {string} source
 * @return {string}
 * @protected
 */
os.ui.file.csv.AbstractCsvParser.prototype.prepareSource = function(source) {
  if (this.config['useHeader']) {
    var toReplace = Math.max(this.config['headerRow'], 1) - 1;
    while (toReplace--) {
      source = source.replace(/.*?(\r?\n)/, '');
    }

    toReplace = this.config['dataRow'] - this.config['headerRow'];

    if (toReplace > 1) {
      // difference between header/data rows is greater than 1, so cut out the extra rows
      var headerRow = source.match(/.*?((\r?\n)|$)/)[0];
      while (toReplace--) {
        source = source.replace(/.*?((\r?\n)|$)/, '');
      }

      // add the header row back
      source = headerRow + source;
    }
  } else {
    // no header, just cut out extra rows prior to the data row
    var toReplace = Math.max(this.config['dataRow'], 1) - 1;
    while (toReplace--) {
      source = source.replace(/.*?((\r?\n)|$)/, '');
    }
  }

  return source;
};


/**
 * Synchronously parse a limited set of results from a source.
 * @param {string} source The CSV source.
 * @param {Array.<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features.
 * @return {Array.<!T>}
 */
os.ui.file.csv.AbstractCsvParser.prototype.parsePreview = goog.abstractMethod;


/**
 * Determines preview columns from the PapaParse results. Will not take mappings into consideration.
 * @param {Papa.Results} results
 * @protected
 */
os.ui.file.csv.AbstractCsvParser.prototype.updateColumnsFromResults = function(results) {
  this.columns.length = 0;

  // get the number of columns from the metadata fields array
  for (var i = 0, n = results.meta.fields.length; i < n; i++) {
    var col = new os.data.ColumnDefinition(results.meta.fields[i]);
    col['selectable'] = true;
    col['sortable'] = false;
    this.columns.push(col);
  }
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCsvParser.prototype.hasNext = function() {
  return this.results.length > 0;
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCsvParser.prototype.parseNext = function() {
  return this.processResult(this.results.pop());
};


/**
 * @inheritDoc
 */
os.ui.file.csv.AbstractCsvParser.prototype.setSource = function(source) {
  goog.array.clear(this.columns);
  goog.array.clear(this.results);

  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  if (goog.isString(source)) {
    // parse the entire source, using workers if available. return results in chunks.
    var config = {
      'chunk': this.handleChunk_.bind(this),
      'comments': this.config['commentChar'] || false,
      'complete': this.handleComplete_.bind(this),
      'delimiter': this.config['delimiter'],
      'dynamicTyping': false,
      'header': this.config['useHeader'],
      'worker': true,
      'skipEmptyLines': true
    };

    source = this.prepareSource(source);
    Papa.parse(source, config);
  }
};
