goog.provide('os.parse.AsyncZipParser');

goog.require('os.parse.AsyncParser');


/**
 * @abstract
 * @extends {os.parse.AsyncParser<T>}
 * @template T
 * @constructor
 */
os.parse.AsyncZipParser = function() {
  os.parse.AsyncZipParser.base(this, 'constructor');

  /**
   * @protected
   * @type {!Array<!zip.Reader>}
   */
  this.zipReaders = [];

  /**
   * @protected
   */
  this.boundZipHandler = this.handleZipReader.bind(this);

  /**
   * @protected
   */
  this.boundZipErrorHandler = this.handleZipReaderError.bind(this);

  /**
   * @protected
   */
  this.boundZipEntriesHandler = this.handleZipEntries.bind(this);
};
goog.inherits(os.parse.AsyncZipParser, os.parse.AsyncParser);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.parse.AsyncZipParser.LOGGER_ = goog.log.getLogger('os.parse.AsyncZipParser');


/**
 * @inheritDoc
 */
os.parse.AsyncZipParser.prototype.disposeInternal = function() {
  this.closeZipReaders();
  os.parse.AsyncZipParser.base(this, 'disposeInternal');
};


/**
 * @protected
 */
os.parse.AsyncZipParser.prototype.closeZipReaders = function() {
  this.zipReaders.forEach(function(reader) {
    reader.close();
  });

  this.zipReaders.length = 0;
};


/**
 * @protected
 * @param {ArrayBuffer} source
 */
os.parse.AsyncZipParser.prototype.createZipReader = function(source) {
  zip.createReader(new zip.ArrayBufferReader(source), this.boundZipHandler, this.boundZipErrorHandler);
};



/**
 * @param {!zip.Reader} reader
 * @protected
 */
os.parse.AsyncZipParser.prototype.handleZipReader = function(reader) {
  this.zipReaders.push(reader);
  reader.getEntries(this.boundZipEntriesHandler);
};


/**
 * @protected
 */
os.parse.AsyncZipParser.prototype.handleZipReaderError = function() {
  goog.log.error(os.parse.AsyncZipParser.LOGGER_, 'There was an error processing the zip file!');
  this.onError();
};


/**
 * @inheritDoc
 */
os.parse.AsyncZipParser.prototype.onError = function() {
  this.closeZipReaders();
  os.parse.AsyncZipParser.base(this, 'onError');
};


/**
 * @abstract
 * @param {Array<!zip.Entry>} entries
 * @protected
 */
os.parse.AsyncZipParser.prototype.handleZipEntries = function(entries) {};

