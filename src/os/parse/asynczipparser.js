goog.declareModuleId('os.parse.AsyncZipParser');

import AsyncParser from './asyncparser.js';

const log = goog.require('goog.log');


/**
 * @abstract
 * @extends {AsyncParser<T>}
 * @template T
 */
export default class AsyncZipParser extends AsyncParser {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.closeZipReaders();
    super.disposeInternal();
  }

  /**
   * @protected
   */
  closeZipReaders() {
    this.zipReaders.forEach(function(reader) {
      reader.close();
    });

    this.zipReaders.length = 0;
  }

  /**
   * @protected
   * @param {ArrayBuffer} source
   */
  createZipReader(source) {
    zip.createReader(new zip.ArrayBufferReader(source), this.boundZipHandler, this.boundZipErrorHandler);
  }

  /**
   * @param {!zip.Reader} reader
   * @protected
   */
  handleZipReader(reader) {
    this.zipReaders.push(reader);
    reader.getEntries(this.boundZipEntriesHandler);
  }

  /**
   * @protected
   */
  handleZipReaderError() {
    log.error(logger, 'There was an error processing the zip file!');
    this.onError();
  }

  /**
   * @inheritDoc
   */
  onError() {
    this.closeZipReaders();
    super.onError();
  }

  /**
   * @abstract
   * @param {Array<!zip.Entry>} entries
   * @protected
   */
  handleZipEntries(entries) {}
}

/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.parse.AsyncZipParser');
