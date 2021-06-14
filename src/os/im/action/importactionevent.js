goog.module('os.im.action.ImportActionEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Import action event.
 *
 * @template T
 */
class ImportActionEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type.
   * @param {FilterActionEntry<T>=} opt_entry The import action entry.
   * @param {boolean=} opt_execute If the entry should be executed immediately.
   */
  constructor(type, opt_entry, opt_execute) {
    super(type);

    /**
     * The entry.
     * @type {FilterActionEntry<T>}
     */
    this.entry = opt_entry || null;

    /**
     * If the entry should be executed.
     * @type {boolean}
     */
    this.execute = opt_execute || false;
  }
}

exports = ImportActionEvent;
