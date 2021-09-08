goog.module('os.ui.file.csv.AbstractCsvParser');

const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const {getText} = goog.require('os.file.mime.text');
const AsyncParser = goog.require('os.parse.AsyncParser');
const {configurePapaParse} = goog.require('os.ui.file.csv');

const BaseParserConfig = goog.requireType('os.parse.BaseParserConfig');


/**
 * A CSV parser driven by PapaParse.
 *
 * @abstract
 * @template T
 */
class AbstractCsvParser extends AsyncParser {
  /**
   * Constructor.
   * @param {BaseParserConfig} config
   */
  constructor(config) {
    super();

    /**
     * @type {Array<ColumnDefinition>}
     * @protected
     */
    this.columns = [];

    /**
     * @type {BaseParserConfig}
     * @protected
     */
    this.config = config;

    /**
     * @type {!Array<Object<string, *>>}
     * @protected
     */
    this.results = [];

    /**
     * The PapaParse parser handle.
     * @type {Papa.ParserHandle|undefined}
     * @private
     */
    this.handle_ = undefined;

    configurePapaParse();
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.results.length = 0;

    if (this.handle_) {
      this.handle_.abort();
      this.handle_ = undefined;
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.cleanup();
    this.config = null;
    super.disposeInternal();
  }

  /**
   * @return {Array<ColumnDefinition>}
   */
  getColumns() {
    return this.columns;
  }

  /**
   * Handle a partial chunk of processed results.
   *
   * @param {Papa.Results} results
   * @param {Papa.ParserHandle} handle
   * @private
   */
  handleChunk_(results, handle) {
    if (results && results.data && results.data.length) {
      this.preprocessResults(results);
      this.results = this.results.concat(results.data);
    }

    this.handle_ = handle;
  }

  /**
   * Handle the final chunk of processed results.
   *
   * @param {Papa.Results} results
   * @private
   */
  handleComplete_(results) {
    if (results && results.data && results.data.length) {
      this.preprocessResults(results);
      this.results = this.results.concat(results.data);
    }

    this.handle_ = undefined;
    this.onReady();
  }

  /**
   * Processes a single PapaParse result.
   *
   * @abstract
   * @protected
   * @param {Object<string, *>} result The result to process
   * @param {Array<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features.
   * @return {!T}
   */
  processResult(result, opt_mappings) {}

  /**
   * Updates parser results if the header row wasn't used so the fields are 'Column 0..n' and each result is an object
   * of (column, value) pairs instead of arrays of values. This ensures results are translated to features correctly.
   *
   * @protected
   * @param {Papa.Results} results
   */
  preprocessResults(results) {
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
  }

  /**
   * Removes extra rows in the provided source using the headerRow and dataRow configuration.
   *
   * @param {string} source
   * @return {string}
   * @protected
   */
  prepareSource(source) {
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
  }

  /**
   * Synchronously parse a limited set of results from a source.
   *
   * @abstract
   * @param {string} source The CSV source.
   * @param {Array<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features.
   * @return {Array<!T>}
   */
  parsePreview(source, opt_mappings) {}

  /**
   * Determines preview columns from the PapaParse results. Will not take mappings into consideration.
   *
   * @param {Papa.Results} results
   * @protected
   */
  updateColumnsFromResults(results) {
    this.columns.length = 0;

    // get the number of columns from the metadata fields array
    for (var i = 0, n = results.meta.fields.length; i < n; i++) {
      var col = new ColumnDefinition(results.meta.fields[i]);
      col['selectable'] = true;
      col['sortable'] = false;
      this.columns.push(col);
    }
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.results.length > 0;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    return this.processResult(this.results.pop());
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.columns.length = 0;
    this.results.length = 0;

    if (source instanceof ArrayBuffer) {
      source = getText(source) || null;
    }

    if (typeof source === 'string') {
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
  }
}

/**
 * @type {number}
 */
AbstractCsvParser.PREVIEW_SIZE = 1000;

exports = AbstractCsvParser;
