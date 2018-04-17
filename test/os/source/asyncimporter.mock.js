goog.provide('os.im.AsyncImporter');
goog.require('goog.async.nextTick');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('os.events.EventType');



/**
 * Mock importer that doesn't require a parser and isn't threaded, but asynchronously fires the complete event. This is
 * used to test THIN-6757 in os.source.ImportQueue.
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.im.AsyncImporter = function() {
  goog.base(this);

  /**
   * @type {Array<*>}
   */
  this.source = null;
};
goog.inherits(os.im.AsyncImporter, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.im.AsyncImporter.prototype.disposeInternal = function() {
  this.reset();
  goog.base(this, 'disposeInternal');
};


/**
 * Simulate starting the import, which just saves the source.
 * @param {Array<*>} source
 */
os.im.AsyncImporter.prototype.startImport = function(source) {
  this.source = source;

  // defer completion so the stack can clear
  goog.async.nextTick(this.onParsingComplete, this);
};


/**
 * Get parsed data from the importer.
 * @param {boolean=} opt_reset If the data should also be reset
 * @return {Array<*>}
 */
os.im.AsyncImporter.prototype.getData = function(opt_reset) {
  return [];
};


/**
 * Handles parser completion
 */
os.im.AsyncImporter.prototype.onParsingComplete = function() {
  // dispatch the event first in case listeners need to reference something on the importer
  this.dispatchEvent(os.events.EventType.COMPLETE);

  // the normal importer would clean up the os.parser... this is roughly the same
  this.reset();
};


/**
 * @inheritDoc
 */
os.im.AsyncImporter.prototype.reset = function() {
  this.source = null;
};
