goog.declareModuleId('os.query.QueryManager');

import Settings from '../config/settings.js';
import DataManager from '../data/datamanager.js';
import DataEventType from '../data/event/dataeventtype.js';
import BaseQueryManager from './basequerymanager.js';

const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: BaseFilterManager} = goog.requireType('os.filter.BaseFilterManager');
const {default: BaseAreaManager} = goog.requireType('os.query.BaseAreaManager');


/**
 * Implementation of the query manager that hooks up to the OS data manager.
 */
export default class QueryManager extends BaseQueryManager {
  /**
   * Constructor.
   * @param {BaseAreaManager=} opt_areaManager Optional area manager reference. Defaults to the singleton.
   * @param {BaseFilterManager=} opt_filterManager Optional filter manager reference. Defaults to the singleton.
   */
  constructor(opt_areaManager, opt_filterManager) {
    super(opt_areaManager, opt_filterManager);

    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onDataSourceRemoved_(event) {
    if (event.source) {
      var id = event.source.getId();

      var i = this.handlers.length;
      while (i--) {
        var handler = this.handlers[i];
        if (handler.getLayerId() === id) {
          var removed = this.handlers.splice(i, 1);
          if (removed) {
            removed.forEach(function(h) {
              dispose(h);
            });
          }
        }
      }

      log.info(logger, 'Removed all query handlers for ' + id);
    }
  }

  /**
   * @inheritDoc
   */
  load() {
    this.entries = /** @type {Array<!Object<string, string|boolean>>} */ (
      Settings.getInstance().get('query.entries', []));
    this.entries = this.entries || [];

    var am = this.am;
    var fm = this.fm;

    // remove entries referencing areas or filters that don't exist
    this.entries = this.entries.filter(function(item) {
      var areaId = /** @type {string} */ (item['areaId']);
      var filterId = /** @type {string} */ (item['filterId']);

      if (areaId && areaId !== '*' && !am.get(areaId)) {
        return false;
      }

      if (filterId && filterId !== '*' && !fm.getFilter(filterId)) {
        return false;
      }

      return true;
    });

    this.updateTimer.start();
  }

  /**
   * @inheritDoc
   */
  save() {
    var toSave = this.entries.filter(
        /**
         * @param {Object<string, string|boolean>} entry
         * @param {number} i
         * @param {Array} arr
         * @return {boolean}
         */
        function(entry, i, arr) {
          return !entry['temp'];
        });

    Settings.getInstance().set(['query', 'entries'], toSave);
  }

  /**
   * Get the global instance.
   * @return {!BaseQueryManager}
   * @override
   */
  static getInstance() {
    if (!instance) {
      instance = new QueryManager();
      BaseQueryManager.setInstance(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {BaseQueryManager} value
   * @override
   */
  static setInstance(value) {
    instance = value;
    BaseQueryManager.setInstance(value);
  }
}

/**
 * Global instance.
 * @type {BaseQueryManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.query.QueryManager');
