goog.module('os.im.AsyncImporter');
goog.module.declareLegacyNamespace();

const nextTick = goog.require('goog.async.nextTick');
const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('os.events.EventType');


/**
 * Mock importer that doesn't require a parser and isn't threaded, but asynchronously fires the complete event. This is
 * used to test THIN-6757 in os.source.ImportQueue.
 */
class AsyncImporter extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Array<*>}
     */
    this.source = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.reset();
    super.disposeInternal();
  }

  /**
   * Simulate starting the import, which just saves the source.
   * @param {Array<*>} source
   */
  startImport(source) {
    this.source = source;

    // defer completion so the stack can clear
    nextTick(this.onParsingComplete, this);
  }

  /**
   * Get parsed data from the importer.
   * @param {boolean=} opt_reset If the data should also be reset
   * @return {Array<*>}
   */
  getData(opt_reset) {
    return [];
  }

  /**
   * Handles parser completion
   */
  onParsingComplete() {
    // dispatch the event first in case listeners need to reference something on the importer
    this.dispatchEvent(EventType.COMPLETE);

    // the normal importer would clean up the os.parser... this is roughly the same
    this.reset();
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.source = null;
  }
}

exports = AsyncImporter;
