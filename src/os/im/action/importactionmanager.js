goog.declareModuleId('os.im.action.ImportActionManager');

import * as olArray from 'ol/src/array.js';

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import CommandProcessor from '../../command/commandprocessor.js';
import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import IFilterable from '../../filter/ifilterable.js';
import osImplements from '../../implements.js';
import {getMapContainer} from '../../map/mapinstance.js';
import PluginManager from '../../plugin/pluginmanager.js';
import FilterActionAdd from './cmd/filteractionaddcmd.js';
import * as osImActionDefault from './defaultaction.js';
import FilterActionEntry from './filteractionentry.js';
import {getEnabledMap, getImportActionManager, setImportActionManager} from './importaction.js';
import ImportActionEventType from './importactioneventtype.js';
import TagName from './tagname.js';

const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const {default: IImportAction} = goog.requireType('os.im.action.IImportAction');


const {default: ImportActionCallbackConfig} = goog.requireType('os.im.action.ImportActionCallbackConfig');
const {default: ImportActionEvent} = goog.requireType('os.im.action.ImportActionEvent');


/**
 * Manager for import actions.
 *
 * @template T
 */
export default class ImportActionManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The user-facing name of import actions for the manager.
     * @type {string}
     */
    this.entryTitle = 'Import Action';

    /**
     * The XML element name for an exported import action entry.
     * @type {string}
     */
    this.xmlEntry = TagName.IMPORT_ACTION;

    /**
     * The XML element name for an exported group of import actions.
     * @type {string}
     */
    this.xmlGroup = TagName.IMPORT_ACTIONS;

    /**
     * Action entries.
     * @type {!Object<string, !Array<!FilterActionEntry<T>>>}
     * @protected
     */
    this.actionEntries = {};

    /**
     * The last action entries applied.
     * @type {!Object<string, !Array<!FilterActionEntry<T>>>}
     * @protected
     */
    this.lastActionEntries = {};

    /**
     * Registered import actions.
     * @type {!Object<string, !IImportAction<T>>}
     * @protected
     */
    this.actionRegistry = {};

    /**
     * The logger.
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * Key used to save import actions to storage.
     * @type {string}
     * @protected
     */
    this.storageKey = ImportActionManager.STORAGE_KEY;

    /**
     * Map to cache which default actions have been loaded.
     * @type {!Object<string, !goog.Promise>}
     * @protected
     */
    this.defaultsLoaded = {};

    // load import actions from storage once plugins have been loaded
    var pm = PluginManager.getInstance();
    pm.listenOnce(GoogEventType.LOAD, this.load, false, this);

    dispatcher.getInstance().listen(ImportActionEventType.ADD_ENTRY, this.onAddActionEntry_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispatcher.getInstance().unlisten(ImportActionEventType.ADD_ENTRY, this.onAddActionEntry_, false, this);
  }

  /**
   * Initialize the manager when entries have been loaded.
   */
  initialize() {}

  /**
   * Create a new import action by identifier.
   *
   * @param {string} id The action identifier.
   * @param {Object=} opt_config Configuration to restore.
   * @return {IImportAction<T>}
   */
  createAction(id, opt_config) {
    var action = null;

    if (id && this.actionRegistry[id]) {
      action = this.actionRegistry[id].clone();

      if (opt_config) {
        action.restore(opt_config);
      }
    }

    return action;
  }

  /**
   * Create a new import action from an XML element.
   *
   * @param {Element} xml The XML element.
   * @return {IImportAction<T>}
   */
  createActionFromXml(xml) {
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
  }

  /**
   * Get the import actions registered with the application.
   *
   * @return {!Array<!IImportAction<T>>}
   */
  getActions() {
    return goog.object.getValues(this.actionRegistry);
  }

  /**
   * If there are import actions registered with the application.
   *
   * @return {boolean}
   */
  hasActions() {
    return !goog.object.isEmpty(this.actionRegistry);
  }

  /**
   * Register an import action with the application.
   *
   * @param {!IImportAction} action The import action.
   */
  registerAction(action) {
    const actionId = action.getId();
    if (actionId) {
      if (actionId in this.actionRegistry) {
        log.warning(this.log, 'The import action with id "' + actionId + '" is being overridden!');
      }

      this.actionRegistry[actionId] = action;
    } else {
      log.error(this.log, 'Unable to register import action without an identifier! Action label is "' +
          action.getLabel() + '".');
    }
  }

  /**
   * Clear all import action entries.
   */
  clearActionEntries() {
    goog.object.clear(this.actionEntries);
    this.apply();
  }

  /**
   * Create a new import action entry.
   *
   * @return {!FilterActionEntry<T>}
   */
  createActionEntry() {
    return new FilterActionEntry();
  }

  /**
   * Get an import action entry by id.
   *
   * @param {string|undefined} id The id.
   * @param {string=} opt_type The entry type.
   * @return {FilterActionEntry<T>} The import action entry, or null if not found.
   */
  getActionEntry(id, opt_type) {
    var list = this.getActionEntries(opt_type);
    var val = null;

    var finder = function(entry) {
      if (val) {
        return;
      }

      if (entry.getId() == id) {
        val = entry;
        return;
      }

      var children = entry.getChildren();
      if (children) {
        children.forEach(finder);
      }
    };

    list.forEach(finder);

    return val;
  }

  /**
   * Get the import action entries.
   *
   * @param {string=} opt_type The entry type, or undefined to get all entries.
   * @return {!Array<!FilterActionEntry<T>>}
   */
  getActionEntries(opt_type) {
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
  }

  /**
   * Set the import action entries for a type.
   *
   * @param {string|undefined} type The entry type.
   * @param {!Array<!FilterActionEntry<T>>} entries The action entries.
   */
  setActionEntries(type, entries) {
    if (type) {
      this.actionEntries[type] = entries;
      this.apply();
    }
  }

  /**
   * Add an import action entry.
   *
   * @param {FilterActionEntry<T>} entry The import action entry.
   * @param {number=} opt_index The index in the entry list.
   * @param {string=} opt_parentId The parent node ID.
   * @param {boolean=} opt_skipApply If the apply call should be skipped. Intended for internal use by the manager.
   */
  addActionEntry(entry, opt_index, opt_parentId, opt_skipApply) {
    if (entry && entry.type && entry.getFilter()) {
      var index = -1;
      if (!(entry.type in this.actionEntries)) {
        // no entries for the type - create the array
        this.actionEntries[entry.type] = [];
      } else {
        // check if the entry already exists
        var list = this.getActionEntries(entry.type);
        index = olArray.findIndex(list, function(e) {
          return e.getId() == entry.getId();
        });
      }

      if (opt_parentId) {
        var parent = this.getActionEntry(opt_parentId);
        if (parent) {
          parent.addChild(entry, opt_index);
        }
      } else {
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
      }

      if (!opt_skipApply) {
        this.apply();
      }
    }
  }

  /**
   * Get all items to process for an entry type.
   *
   * @param {string} type The import action entry type.
   * @return {Array<T>} The items to process.
   * @protected
   */
  getEntryItems(type) {
    return null;
  }

  /**
   * Executes enabled import action entries of a type against a set of items.
   * @param {string} entryType The entry type.
   * @param {Array<T>} items The items to process.
   * @param {boolean=} opt_unprocess Reset existing items
   * @param {boolean=} opt_unprocessOnly Do not process enabled entries
   * @return {Array<ImportActionCallbackConfig>|undefined}
   * @protected
   */
  processItemsProtected(entryType, items, opt_unprocess, opt_unprocessOnly) {
    if (items && items.length > 0) {
      const configs = [];
      const entries = this.actionEntries[entryType];
      let last = this.lastActionEntries[entryType] || [];

      if ((opt_unprocess || opt_unprocessOnly) && last.length > 0) {
        let cfgs = null;
        for (let i = 0; i < last.length; i++) {
          cfgs = last[i].unprocessItems(items);

          if (cfgs) {
            configs.push(...cfgs);
          }
        }
        last = [];
      }

      if (!opt_unprocessOnly && entries && entries.length > 0) {
        for (let i = 0; i < entries.length; i++) {
          let cfgs = null;
          if (entries[i].isEnabled()) {
            cfgs = entries[i].processItems(items);
            last.push(entries[i]);
          }
          if (cfgs) {
            configs.push(...cfgs);
          }
        }
      }

      this.lastActionEntries[entryType] = last;
      return configs;
    }
  }

  /**
   * Executes enabled import action entries of a type against a set of items.
   *
   * @param {string} entryType The entry type.
   * @param {Array<T>=} opt_items The items to process.
   * @param {boolean=} opt_unprocess Reset existing items
   */
  processItems(entryType, opt_items, opt_unprocess) {
    var items = opt_items || this.getEntryItems(entryType);
    if (items && items.length > 0) {
      this.processItemsProtected(entryType, items, opt_unprocess);
    }
  }

  /**
   * Explicit call to unprocess items - used when an action is removed
   *
   * @param {string} entryType The entry type.
   * @param {Array<T>} items The items to process.
   */
  unprocessItems(entryType, items) {
    if (items && items.length > 0) {
      this.processItemsProtected(entryType, items, true, true);
    }
  }

  /**
   * Reapplies all actions on applicable data types. This acts to both apply the actions to new features as well
   * as to unapply them from old features.
   *
   * @param {string} entryType The entry type.
   * @param {Array<T>=} opt_items The items to process.
   */
  updateItems(entryType, opt_items) {
    window['currentFilterTimestamp'] = Date.now();

    var items = opt_items || this.getEntryItems(entryType);
    if (items && items.length > 0) {
      var entries = this.actionEntries[entryType];
      if (entries && entries.length > 0) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isEnabled()) {
            entries[i].updateItems(items);
          }
        }
      }
    }
  }

  /**
   * Remove an import action entry.
   *
   * @param {FilterActionEntry<T>} entry The import action entry.
   * @param {string=} opt_parentId The parent node ID.
   */
  removeActionEntry(entry, opt_parentId) {
    if (entry && entry.type in this.actionEntries) {
      this.unprocessItems(entry.type, this.getEntryItems(entry.type));

      if (opt_parentId) {
        var parent = this.getActionEntry(opt_parentId);
        if (parent) {
          parent.removeChild(entry);
        }
      } else {
        var entries = this.actionEntries[entry.type];
        olArray.remove(entries, entry);

        if (entries.length == 0) {
          delete this.actionEntries[entry.type];
        }
      }

      this.processItems(entry.type);
      this.apply();
    }
  }

  /**
   * Load import actions from storage.
   */
  load() {
    var obj = /** @type {!Object} */ (Settings.getInstance().get(this.storageKey, {}));

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
    this.dispatchEvent(ImportActionEventType.REFRESH);
  }

  /**
   * Load default actions for a source.
   *
   * @param {string} id The internal layer ID.
   * @return {!goog.Promise}
   */
  loadDefaults(id) {
    if (!this.defaultsLoaded[id]) {
      var defaultActions = /** @type {Object<string, Array<osx.ResourceConfig>>|undefined} */ (
        Settings.getInstance().get(osImActionDefault.SettingKey.FILES));

      var filterKey = id;
      var layer = getMapContainer().getLayer(id);
      if (osImplements(layer, IFilterable.ID)) {
        filterKey = /** @type {IFilterable} */ (layer).getFilterKey();
      }

      if (filterKey && defaultActions && defaultActions[filterKey]) {
        this.defaultsLoaded[id] = osImActionDefault.load(id, defaultActions[filterKey]).then((entries) => {
          if (entries && entries.length) {
            // add all of the default entries from the right, we are inserting them from the top, so this maintains order
            goog.array.forEachRight(entries, function(entry) {
              // add the entry to the manager but skip apply to defer the refresh event
              this.addActionEntry(entry, 0, undefined, true);
            }, this);

            // notify entries have changed
            this.dispatchEvent(ImportActionEventType.REFRESH);
          }
        }, (opt_reason) => {
          var reason = 'Unspecified error.';
          if (typeof opt_reason == 'string') {
            reason = opt_reason;
          } else if (opt_reason instanceof Error) {
            reason = opt_reason.message;
          }

          log.error(this.log, 'Failed loading default actions for "' + id + '": ' + reason);
        });
      } else {
        // there are no default actions for that ID, so just return a plain resolved promise
        this.defaultsLoaded[id] = goog.Promise.resolve();
      }
    }

    return this.defaultsLoaded[id];
  }

  /**
   * Apply the manager by sending out an event and saving.
   */
  apply() {
    this.dispatchEvent(ImportActionEventType.REFRESH);
    this.save();
  }

  /**
   * Save import actions to storage.
   */
  save() {
    var defaultEnabled = {};
    var obj = {};

    for (var type in this.actionEntries) {
      var entries = this.actionEntries[type];
      if (entries.length > 0) {
        var entryConfigs = [];
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.isDefault()) {
            if (!defaultEnabled[type]) {
              defaultEnabled[type] = {};
            }

            // store the enabled state of default actions
            getEnabledMap(e, defaultEnabled[type]);
          } else if (!e.isTemporary()) {
            // persist the entire entry if it is not a default or temporary action
            entryConfigs.push(e.persist());
          }
        }

        obj[type] = entryConfigs;
      }
    }

    Settings.getInstance().set(osImActionDefault.SettingKey.ENABLED, defaultEnabled);
    Settings.getInstance().set(this.storageKey, obj);
  }

  /**
   * Handle an add action entry event fired on the global dispatcher.
   *
   * @param {ImportActionEvent} event The event.
   * @private
   */
  onAddActionEntry_(event) {
    var entry = event.entry;

    if (entry && !(entry instanceof FilterActionEntry)) {
      try {
        // probably came from another window context
        var clone = this.createActionEntry();
        clone.restore(entry.persist());

        if (clone instanceof FilterActionEntry) {
          entry = clone;
        } else {
          log.error(this.log, 'Failed adding ' + this.entryTitle.toLowerCase() +
            '. Unable to determine entry type.');
          entry = null;
        }
      } catch (e) {
        log.error(this.log, 'Failed adding ' + this.entryTitle.toLowerCase() + ':', e);
        entry = null;
      }
    }

    if (entry) {
      var cmd = new FilterActionAdd(entry);
      CommandProcessor.getInstance().addCommand(cmd);

      if (event.execute) {
        var items = this.getEntryItems(entry.getType());
        this.processItems(entry.type, items);
      }
    } else {
      var msg = 'Failed adding ' + this.entryTitle.toLowerCase() + '. See the log for details.';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }
  }

  /**
   * @param {string} id
   * @return {boolean}
   */
  hasActiveActions(id) {
    var featureActions = id == undefined ? [] : this.getActionEntries(id);

    const hasActiveActions = (action) => action.isEnabled();

    return featureActions.some(hasActiveActions);
  }

  /**
   * Depth-first traversal of tree; returns ID's of active FeatureActions
   *
   * @param {string|undefined} type
   * @param {Array<FilterActionEntry<T>>} entries
   * @return {!Array<string>}
   * @private
   */
  getActiveActionEntryIds_(type, entries) {
    const ids = [];
    if (entries) {
      entries.forEach((entry) => {
        if (entry['enabled'] && entry.type == type) {
          ids.push(entry.getId());
        }
        ids.push(...this.getActiveActionEntryIds_(type, entry.getChildren()));
      });
    }
    return ids;
  }

  /**
   * Depth-first traversal of tree; returns ID's of active FeatureActions
   *
   * @param {string|undefined} type
   * @return {!Array<string>}
   */
  getActiveActionEntryIds(type) {
    return this.getActiveActionEntryIds_(type, this.getActionEntries());
  }

  /**
   * Get simplified list of active FeatureActions (no repeats via children)
   *
   * @param {string|undefined} type
   * @param {FilterActionEntry<T>=} entry
   * @return {!boolean}
   * @private
   */
  getRootActiveActionEntries_(type, entry) {
    let isActive = false;

    if (entry && entry['enabled'] && entry.type == type) {
      isActive = true;
    } else if (entry) {
      const entries = entry.getChildren();

      if (entries) {
        isActive = entries.some((e) => {
          return this.getRootActiveActionEntries_(type, e);
        });
      }
    }
    return isActive;
  }

  /**
   * Depth-first traversal of tree; returns ID's of active FeatureActions
   *
   * @param {string|undefined} type
   * @return {!Array<FilterActionEntry<T>>}
   */
  getRootActiveActionEntries(type) {
    return this.getActionEntries().filter((entry) => {
      return this.getRootActiveActionEntries_(type, entry);
    });
  }

  /**
   * Get the global instance.
   * @return {!ImportActionManager}
   */
  static getInstance() {
    // Global instance is managed by the os.im.action module to avoid circular dependency issues.
    let instance = getImportActionManager();
    if (!instance) {
      instance = new ImportActionManager();
      setImportActionManager(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ImportActionManager} value The instance.
   */
  static setInstance(value) {
    setImportActionManager(value);
  }
}

/**
 * Logger for os.im.action.ImportActionManager.
 * @type {log.Logger}
 */
const logger = log.getLogger('os.im.action.ImportActionManager');


/**
 * @type {string}
 * @const
 */
ImportActionManager.STORAGE_KEY = 'os.importActions';
