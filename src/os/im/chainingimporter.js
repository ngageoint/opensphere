goog.provide('os.im.ChainingImporter');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('os.events.EventType');
goog.require('os.im.IImporter');



/**
 * Imports a set of items via multiple importers
 * @param {!Array<!os.im.IImporter>} chain The chain of importers to execute
 * @implements {os.im.IImporter}
 * @extends {goog.events.EventTarget}
 * @constructor
 * @template T
 */
os.im.ChainingImporter = function(chain) {
  goog.asserts.assert(goog.isDefAndNotNull(chain), 'importer chain cannot be null');
  goog.asserts.assert(chain.length > 0, 'importer chain cannot be empty');

  os.im.ChainingImporter.base(this, 'constructor');

  /**
   * The importer chain
   * @type {!Array<!os.im.IImporter>}
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
};
goog.inherits(os.im.ChainingImporter, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.getMappings = function() { /* NO-OP */ };


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.setMappings = function(value) { /* NO-OP */ };


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.disposeInternal = function() {
  this.reset();
  os.im.ChainingImporter.base(this, 'disposeInternal');
};


/**
 * Executes the next importer in the chain.
 * @param {Object|Array|string|Node|Document} source Source
 * @private
 */
os.im.ChainingImporter.prototype.executeNext_ = function(source) {
  this.current_++;

  if (this.current_ < this.chain_.length) {
    var importer = this.chain_[this.current_];
    importer.listenOnce(os.events.EventType.COMPLETE, this.onImporterComplete_, false, this);
    importer.startImport(source);
  } else {
    // reset the importer index
    this.current_ = -1;

    // set the final data
    if (goog.isArray(source)) {
      this.data_ = source;
    }

    // dispatch the complete event
    this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
  }
};


/**
 * Handle importer completion.
 * @param {goog.events.Event} event
 * @private
 */
os.im.ChainingImporter.prototype.onImporterComplete_ = function(event) {
  var importer = /** @type {!os.im.IImporter} */ (event.target);
  this.executeNext_(importer.getData());
};


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.getData = function(opt_reset) {
  var reset = goog.isDefAndNotNull(opt_reset) ? opt_reset : true;
  var ret = this.data_;
  if (reset) {
    this.data_ = [];
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.getParser = function() {
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
};


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.reset = function() {
  this.stop();
  this.data_ = [];
};


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.startImport = function(source) {
  this.current_ = -1;
  this.executeNext_(source);
};


/**
 * @inheritDoc
 */
os.im.ChainingImporter.prototype.stop = function() {
  if (this.current_ > -1) {
    var importer = this.chain_[this.current_];
    importer.unlisten(os.events.EventType.COMPLETE, this.onImporterComplete_, false, this);
    importer.stop();
  }

  this.current_ = -1;
};
