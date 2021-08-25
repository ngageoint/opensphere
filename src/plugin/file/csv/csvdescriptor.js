goog.module('plugin.file.csv.CSVDescriptor');
goog.module.declareLegacyNamespace();

const Settings = goog.require('os.config.Settings');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const LayerType = goog.require('os.layer.LayerType');
const csv = goog.require('os.ui.file.csv');
const CSVExporter = goog.require('plugin.file.csv.CSVExporter');
const CSVParserConfig = goog.require('plugin.file.csv.CSVParserConfig');
const {ALLOW_ELLIPSE_CONFIG} = goog.require('os.ui.layer.EllipseColumnsUI');


/**
 * CSV file descriptor.
 */
class CSVDescriptor extends FileDescriptor {
  /**
   * Constructor.
   * @param {CSVParserConfig=} opt_config
   */
  constructor(opt_config) {
    super();
    this.descriptorType = 'csv';
    this.parserConfig = opt_config || new CSVParserConfig();
  }

  /**
   * @inheritDoc
   */
  getType() {
    return LayerType.FEATURES;
  }

  /**
   * @inheritDoc
   */
  supportsMapping() {
    return !!Settings.getInstance().get(ALLOW_ELLIPSE_CONFIG, false);
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = super.getLayerOptions();
    options['type'] = 'CSV';
    options['commentChar'] = this.getCommentChar();
    options['dataRow'] = this.getDataRow();
    options['delimiter'] = this.getDelimiter();
    options['headerRow'] = this.getHeaderRow();
    options['useHeader'] = this.getUseHeader();
    return options;
  }

  /**
   * @return {string}
   */
  getCommentChar() {
    return this.parserConfig['commentChar'];
  }

  /**
   * @param {string} commentChar
   */
  setCommentChar(commentChar) {
    this.parserConfig['commentChar'] = commentChar;
  }

  /**
   * @return {number}
   */
  getDataRow() {
    return this.parserConfig['dataRow'];
  }

  /**
   * @param {number} row
   */
  setDataRow(row) {
    this.parserConfig['dataRow'] = row;
  }

  /**
   * @return {string}
   */
  getDelimiter() {
    return this.parserConfig['delimiter'];
  }

  /**
   * @param {string} delimiter
   */
  setDelimiter(delimiter) {
    this.parserConfig['delimiter'] = delimiter;
  }

  /**
   * @return {number}
   */
  getHeaderRow() {
    return this.parserConfig['headerRow'];
  }

  /**
   * @param {number} row
   */
  setHeaderRow(row) {
    this.parserConfig['headerRow'] = row;
  }

  /**
   * @return {number}
   */
  getUseHeader() {
    return this.parserConfig['useHeader'];
  }

  /**
   * @param {boolean} useHeader
   */
  setUseHeader(useHeader) {
    this.parserConfig['useHeader'] = useHeader;
  }

  /**
   * @inheritDoc
   */
  getExporter() {
    return new CSVExporter();
  }

  /**
   * @inheritDoc
   */
  onFileChange(options) {
    super.onFileChange(options);

    // update the parser config to match the default parser config
    const conf = csv.DEFAULT_CONFIG;
    this.parserConfig['color'] = conf['color'];
    this.parserConfig['commentChar'] = conf['commentChar'];
    this.parserConfig['dataRow'] = conf['dataRow'];
    this.parserConfig['delimiter'] = conf['delimiter'];
    this.parserConfig['headerRow'] = conf['headerRow'];
    this.parserConfig['useHeader'] = conf['useHeader'];
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['commentChar'] = this.getCommentChar();
    opt_obj['dataRow'] = this.getDataRow();
    opt_obj['delimiter'] = this.getDelimiter();
    opt_obj['headerRow'] = this.getHeaderRow();
    opt_obj['useHeader'] = this.getUseHeader();

    return super.persist(opt_obj);
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.setCommentChar(conf['commentChar']);
    this.setDataRow(conf['dataRow']);
    this.setDelimiter(conf['delimiter']);
    this.setHeaderRow(conf['headerRow']);
    this.setUseHeader(conf['useHeader']);

    super.restore(conf);
  }
}

exports = CSVDescriptor;
