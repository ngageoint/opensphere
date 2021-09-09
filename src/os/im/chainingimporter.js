goog.module('os.im.ChainingImporter');

const {assert} = goog.require('goog.asserts');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('os.events.EventType');

const IImporter = goog.requireType('os.im.IImporter');


/**
 * Imports a set of items via multiple importers
 *
 * @implements {IImporter}
 * @template T
 */
class ChainingImporter extends EventTarget {
  /**
   * Constructor.
   * @param {!Array<!IImporter>} chain The chain of importers to execute
   */
  constructor(chain) {
    assert(chain != null, 'importer chain cannot be null');
    assert(chain.length > 0, 'importer chain cannot be empty');

    super();

    /**
     * The importer chain
     * @type {!Array<!IImporter>}
     * @private
     */
    this.chain_ = chain;

    /**
     * Index of the currently executing importer
     * @type {number}
     * @private
     */
    this.current_ = -1;

    /**
     * Data from the import
     * @type {!Array<!T>}
     * @private
     */
    this.data_ = [];
  }

  /**
   * @inheritDoc
   */
  getMappings() {/* NO-OP */}

  /**
   * @inheritDoc
   */
  setMappings(value) {/* NO-OP */}

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.reset();
    super.disposeInternal();
  }

  /**
   * Executes the next importer in the chain.
   *
   * @param {Object|Array|string|Node|Document} source Source
   * @private
   */
  executeNext_(source) {
    this.current_++;

    if (this.current_ < this.chain_.length) {
      var importer = this.chain_[this.current_];
      importer.listenOnce(EventType.COMPLETE, this.onImporterComplete_, false, this);
      importer.startImport(source);
    } else {
      // reset the importer index
      this.current_ = -1;

      // set the final data
      if (Array.isArray(source)) {
        this.data_ = source;
      }

      // dispatch the complete event
      this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
    }
  }

  /**
   * Handle importer completion.
   *
   * @param {GoogEvent} event
   * @private
   */
  onImporterComplete_(event) {
    var importer = /** @type {!IImporter} */ (event.target);
    this.executeNext_(importer.getData());
  }

  /**
   * @inheritDoc
   */
  getData(opt_reset) {
    var reset = opt_reset != null ? opt_reset : true;
    var ret = this.data_;
    if (reset) {
      this.data_ = [];
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  getParser() {
    if (this.current_ > -1 && this.current_ < this.chain_.length) {
      // TODO: fire an intermediate progress event when each importer before the last completes if we come up with a case
      // where this is needed
      //
      // return the parser for the current importer
      return this.chain_[this.current_].getParser();
    } else if (this.chain_.length > 0) {
      // return the parser for the last importer
      return this.chain_[this.chain_.length - 1].getParser();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.stop();
    this.data_ = [];
  }

  /**
   * @inheritDoc
   */
  startImport(source) {
    this.current_ = -1;
    this.executeNext_(source);
  }

  /**
   * @inheritDoc
   */
  stop() {
    if (this.current_ > -1) {
      var importer = this.chain_[this.current_];
      importer.unlisten(EventType.COMPLETE, this.onImporterComplete_, false, this);
      importer.stop();
    }

    this.current_ = -1;
  }
}

exports = ChainingImporter;
