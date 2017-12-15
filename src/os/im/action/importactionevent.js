goog.provide('os.im.action.ImportActionEvent');
goog.provide('os.im.action.ImportActionEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.im.action.ImportActionEventType = {
  ADD_ENTRY: 'importAction:addEntry',
  COPY_ENTRY: 'importAction:copyEntry',
  EDIT_ENTRY: 'importAction:editEntry',
  REMOVE_ENTRY: 'importAction:removeEntry',
  REFRESH: 'importAction:refresh'
};



/**
 * Import action event.
 * @param {string} type The event type.
 * @param {os.im.action.FilterActionEntry<T>=} opt_entry The import action entry.
 * @param {boolean=} opt_execute If the entry should be executed immediately.
 * @extends {goog.events.Event}
 * @constructor
 * @template T
 */
os.im.action.ImportActionEvent = function(type, opt_entry, opt_execute) {
  os.im.action.ImportActionEvent.base(this, 'constructor', type);

  /**
   * The entry.
   * @type {os.im.action.FilterActionEntry<T>}
   */
  this.entry = opt_entry || null;

  /**
   * If the entry should be executed.
   * @type {boolean}
   */
  this.execute = opt_execute || false;
};
goog.inherits(os.im.action.ImportActionEvent, goog.events.Event);
