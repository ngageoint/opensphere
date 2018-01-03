goog.provide('os.im.action.ImportActionManager');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.ImportActionEventType');
goog.require('os.im.action.cmd.FilterActionAdd');
goog.require('os.plugin.PluginManager');



/**
 * Manager for import actions.
 * @extends {goog.events.EventTarget}
 * @constructor
 * @template T
 */
os.im.action.ImportActionManager = function() {
  os.im.action.ImportActionManager.base(this, 'constructor');

  /**
   * The user-facing name of import actions for the manager.
   * @type {string}
   */
  this.entryTitle = 'Import Action';

  /**
   * The XML element name for an exported import action entry.
   * @type {string}
   */
  this.xmlEntry = os.im.action.TagName.IMPORT_ACTION;

  /**
   * The XML element name for an exported group of import actions.
   * @type {string}
   */
  this.xmlGroup = os.im.action.TagName.IMPORT_ACTIONS;

  /**
   * Action entries.
   * @type {!Object<string, !Array<!os.im.action.FilterActionEntry<T>>>}
   * @protected
   */
  this.actionEntries = {};

  /**
   * Registered import actions.
   * @type {!Object<string, !os.im.action.IImportAction<T>>}
   * @protected
   */
  this.actionRegistry = {};

  /**
   * The logger.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.im.action.ImportActionManager.LOGGER_;

  /**
   * Key used to save import actions to storage.
   * @type {string}
   * @protected
   */
  this.storageKey = os.im.action.ImportActionManager.STORAGE_KEY;

  // load import actions from storage once plugins have been loaded
  var pm = os.plugin.PluginManager.getInstance();
  pm.listenOnce(goog.events.EventType.LOAD, this.load, false, this);

  os.dispatcher.listen(os.im.action.ImportActionEventType.ADD_ENTRY, this.onAddActionEntry_, false, this);
};
goog.inherits(os.im.action.ImportActionManager, goog.events.EventTarget);
goog.addSingletonGetter(os.im.action.ImportActionManager);


/**
 * Logger for os.im.action.ImportActionManager.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.action.ImportActionManager.LOGGER_ = goog.log.getLogger('os.im.action.ImportActionManager');


/**
 * @type {string}
 * @const
 */
os.im.action.ImportActionManager.STORAGE_KEY = 'os.importActions';


/**
 * @inheritDoc
 */
os.im.action.ImportActionManager.prototype.disposeInternal = function() {
  os.im.action.ImportActionManager.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.im.action.ImportActionEventType.ADD_ENTRY, this.onAddActionEntry_, false, this);
};


/**
 * Create a new import action by identifier.
 * @param {string} id The action identifier.
 * @param {Object=} opt_config Configuration to restore.
 * @return {os.im.action.IImportAction<T>}
 */
os.im.action.ImportActionManager.prototype.createAction = function(id, opt_config) {
  var action = null;

  if (id && this.actionRegistry[id]) {
    action = this.actionRegistry[id].clone();

    if (opt_config) {
      action.restore(opt_config);
    }
  }

  return action;
};


/**
 * Create a new import action from an XML element.
 * @param {Element} xml The XML element.
 * @return {os.im.action.IImportAction<T>}
 */
os.im.action.ImportActionManager.prototype.createActionFromXml = function(xml) {
  var action = null;
  if (xml) {
    var localName = xml.localName.toLowerCase();

    for (var id in this.actionRegistry) {
      var current = this.actionRegistry[id];
      if (current.xmlType.toLowerCase() == localName) {
        action = current.clone();
        action.fromXml(xml);
        break;
      }
    }
  }

  return action;
};


/**
 * Get the import actions registered with the application.
 * @return {!Array<!os.im.action.IImportAction<T>>}
 */
os.im.action.ImportActionManager.prototype.getActions = function() {
  return goog.object.getValues(this.actionRegistry);
};


/**
 * If there are import actions registered with the application.
 * @return {boolean}
 */
os.im.action.ImportActionManager.prototype.hasActions = function() {
  return !goog.object.isEmpty(this.actionRegistry);
};


/**
 * Register an import action with the application.
 * @param {!os.im.action.IImportAction} action The import action.
 */
os.im.action.ImportActionManager.prototype.registerAction = function(action) {
  if (action.id) {
    if (action.id in this.actionRegistry) {
      goog.log.warning(this.log, 'The import action with id "' + action.id + '" is being overridden!');
    }

    this.actionRegistry[action.id] = action;
  } else {
    goog.log.error(this.log, 'Unable to register import action without an identifier! Action label is "' +
        action.getLabel() + '".');
  }
};


/**
 * Clear all import action entries.
 */
os.im.action.ImportActionManager.prototype.clearActionEntries = function() {
  goog.object.clear(this.actionEntries);
  this.dispatchEvent(os.im.action.ImportActionEventType.REFRESH);
  this.save();
};


/**
 * Create a new import action entry.
 * @return {!os.im.action.FilterActionEntry<T>}
 */
os.im.action.ImportActionManager.prototype.createActionEntry = function() {
  return new os.im.action.FilterActionEntry();
};


/**
 * Get an import action entry by id.
 * @param {string|undefined} id The id.
 * @param {string=} opt_type The entry type.
 * @return {os.im.action.FilterActionEntry<T>} The import action entry, or null if not found.
 */
os.im.action.ImportActionManager.prototype.getActionEntry = function(id, opt_type) {
  var list = this.getActionEntries(opt_type);
  return goog.array.find(list, function(entry) {
    return entry.getId() == id;
  });
};


/**
 * Get the import action entries.
 * @param {string=} opt_type The entry type, or undefined to get all entries.
 * @return {!Array<!os.im.action.FilterActionEntry<T>>}
 */
os.im.action.ImportActionManager.prototype.getActionEntries = function(opt_type) {
  var entries;

  if (opt_type) {
    // return entries for the provided type
    entries = this.actionEntries[opt_type] ? this.actionEntries[opt_type].slice() : [];
  } else {
    // no type - return all entries
    entries = [];

    for (var type in this.actionEntries) {
      entries = entries.concat(this.actionEntries[type]);
    }
  }

  return entries;
};


/**
 * Set the import action entries for a type.
 * @param {string|undefined} type The entry type.
 * @param {!Array<!os.im.action.FilterActionEntry<T>>} entries The action entries.
 */
os.im.action.ImportActionManager.prototype.setActionEntries = function(type, entries) {
  if (type) {
    this.actionEntries[type] = entries;
    this.dispatchEvent(os.im.action.ImportActionEventType.REFRESH);
    this.save();
  }
};


/**
 * Add an import action entry.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 * @param {number=} opt_index The index in the entry list.
 */
os.im.action.ImportActionManager.prototype.addActionEntry = function(entry, opt_index) {
  if (entry && entry.type && entry.getFilter()) {
    var index = -1;
    if (!(entry.type in this.actionEntries)) {
      // no entries for the type - create the array
      this.actionEntries[entry.type] = [];
    } else {
      // check if the entry already exists
      var list = this.getActionEntries(entry.type);
      index = goog.array.findIndex(list, function(e) {
        return e.getId() == entry.getId();
      });
    }

    var entries = this.actionEntries[entry.type];
    if (index > -1) {
      // replace the existing entry
      entries[index] = entry;
    } else if (opt_index > -1 && opt_index < entries.length) {
      // insert at the given index
      goog.array.insertAt(entries, entry, opt_index);
    } else {
      // append to the end of the array
      entries.push(entry);
    }

    this.dispatchEvent(os.im.action.ImportActionEventType.REFRESH);
    this.save();
  }
};


/**
 * Get all items to process for an entry type.
 * @param {string} type The import action entry type.
 * @return {Array<T>} The items to process.
 * @protected
 */
os.im.action.ImportActionManager.prototype.getEntryItems = function(type) {
  return null;
};


/**
 * Executes enabled import action entries of a type against a set of items.
 * @param {string} entryType The entry type.
 * @param {Array<T>=} opt_items The items to process.
 */
os.im.action.ImportActionManager.prototype.processItems = function(entryType, opt_items) {
  var items = opt_items || this.getEntryItems(entryType);
  if (items && items.length > 0) {
    var entries = (this.actionEntries[entryType] || []).filter(os.im.action.testFilterActionEnabled);
    if (entries && entries.length > 0) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].processItems(items);
      }
    }
  }
};


/**
 * Remove an import action entry.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 */
os.im.action.ImportActionManager.prototype.removeActionEntry = function(entry) {
  if (entry && entry.type in this.actionEntries) {
    var entries = this.actionEntries[entry.type];
    goog.array.remove(entries, entry);

    if (entries.length == 0) {
      delete this.actionEntries[entry.type];
    }

    this.dispatchEvent(os.im.action.ImportActionEventType.REFRESH);
    this.save();
  }
};


/**
 * Load import actions from storage.
 */
os.im.action.ImportActionManager.prototype.load = function() {
  var obj = /** @type {!Object} */ (os.settings.get(this.storageKey, {}));

  for (var type in obj) {
    var entries = [];
    var entryConfigs = /** @type {Array<!Object>} */ (obj[type]);
    if (entryConfigs) {
      for (var i = 0; i < entryConfigs.length; i++) {
        var entry = this.createActionEntry();
        entry.restore(entryConfigs[i]);
        entries.push(entry);
      }
    }

    this.actionEntries[type] = entries;
  }

  this.initialize();
  this.dispatchEvent(os.im.action.ImportActionEventType.REFRESH);
};


/**
 * Initialize the manager when entries have been loaded.
 */
os.im.action.ImportActionManager.prototype.initialize = goog.nullFunction;


/**
 * Save import actions to storage.
 */
os.im.action.ImportActionManager.prototype.save = function() {
  var obj = {};

  for (var type in this.actionEntries) {
    var entries = this.actionEntries[type];
    if (entries.length > 0) {
      var entryConfigs = [];
      for (var i = 0; i < entries.length; i++) {
        entryConfigs.push(entries[i].persist());
      }

      obj[type] = entryConfigs;
    }
  }

  os.settings.set(this.storageKey, obj);
};


/**
 * Handle an add action entry event fired on the global dispatcher.
 * @param {goog.events.Event} event The event.
 * @private
 */
os.im.action.ImportActionManager.prototype.onAddActionEntry_ = function(event) {
  var entry = event.entry;

  if (entry && !(entry instanceof os.im.action.FilterActionEntry)) {
    try {
      // probably came from another window context
      var clone = this.createActionEntry();
      clone.restore(entry.persist());

      if (clone instanceof os.im.action.FilterActionEntry) {
        entry = clone;
      } else {
        goog.log.error(this.log, 'Failed adding ' + this.entryTitle.toLowerCase() +
            '. Unable to determine entry type.');
        entry = null;
      }
    } catch (e) {
      goog.log.error(this.log, 'Failed adding ' + this.entryTitle.toLowerCase() + ':', e);
      entry = null;
    }
  }

  if (entry) {
    var cmd = new os.im.action.cmd.FilterActionAdd(entry);
    os.commandStack.addCommand(cmd);

    if (event.execute) {
      var items = this.getEntryItems(entry.getType());
      entry.processItems(items);
    }
  } else {
    var msg = 'Failed adding ' + this.entryTitle.toLowerCase() + '. See the log for details.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }
};
