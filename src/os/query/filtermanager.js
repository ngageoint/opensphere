goog.declareModuleId('os.query.FilterManager');

import Settings from '../config/settings.js';
import BaseFilterManager from '../filter/basefiltermanager.js';
import FilterType from '../filter/filtertype.js';
import VectorLayer from '../layer/vector.js';
import {getMapContainer} from '../map/mapinstance.js';
import {FILTER_STORAGE_KEY} from '../os.js';
import FilterEvent from '../ui/filter/filterevent.js';
import FilterEventType from '../ui/filter/filtereventtype.js';
import * as osWindow from '../ui/window.js';
import {getQueryManager} from './queryinstance.js';

const {hashCode} = goog.require('goog.string');

const {default: IFilterable} = goog.requireType('os.filter.IFilterable');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * OS implementation of the filter manager.
 */
export default class FilterManager extends BaseFilterManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  load() {
    var obj = Settings.getInstance().get(FILTER_STORAGE_KEY);

    if (obj) {
      for (var key in obj) {
        var type = new FilterType();
        type.restore(obj[key]);
        this.types[key] = type;
      }

      this.dispatchEvent(new FilterEvent(FilterEventType.FILTERS_REFRESH));
    }
  }

  /**
   * @inheritDoc
   */
  save() {
    var obj = {};

    for (var type in this.types) {
      if (this.hasFilters(type)) {
        obj[type] = this.types[type].persist();
      }
    }

    Settings.getInstance().set(FILTER_STORAGE_KEY, obj);
  }

  /**
   * @override
   */
  isEnabled(filter, opt_type) {
    var qm = getQueryManager();

    if (filter) {
      var results = qm.getEntries(opt_type, null, filter.getId());
      return !!results && !!results.length;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getFilterable(layerId) {
    var layer = getMapContainer().getLayer(layerId);

    if (layer instanceof VectorLayer) {
      return /** @type {IFilterable} */ (layer);
    }

    return super.getFilterable(layerId);
  }

  /**
   * Whether or not a filter window is up for the given type
   *
   * @param {?string=} opt_type
   * @return {boolean} True if a window exists, false otherwise
   */
  isOpen(opt_type) {
    return $('#filter' + (opt_type ? '-' + hashCode(opt_type) : '')).length > 0;
  }

  /**
   * Opens the filter manager UI
   *
   * @param {string=} opt_type
   * @param {Array<FeatureTypeColumn>=} opt_columns
   */
  open(opt_type, opt_columns) {
    if (!this.isOpen(opt_type)) {
      var options = {
        id: 'filter' + (opt_type ? '-' + hashCode(opt_type) : ''),
        x: 'center',
        y: 'center',
        label: 'Filters',
        'show-close': true,
        'min-width': 300,
        'min-height': 300,
        'max-width': 1000,
        'max-height': 1000,
        width: 400,
        height: 500,
        icon: 'filter-icon fa fa-filter'
      };

      var scopeOptions = {};
      if (opt_type) {
        var layer = /** @type {ILayer} */ (getMapContainer().getLayer(opt_type));
        if (layer) {
          if (!opt_columns) {
            try {
              var filterable = /** @type {IFilterable} */ (layer);
              if (filterable.isFilterable()) {
                filterable.launchFilterManager();
              }

              return;
            } catch (e) {
              // not an IFilterable instance
            }
          } else {
            scopeOptions['columns'] = opt_columns;
          }

          options.label = layer.getTitle() + ' Filters';
        }

        scopeOptions['type'] = opt_type;
      }

      osWindow.create(options, 'filters', undefined, undefined, undefined, scopeOptions);
    }
  }

  /**
   * Get the global instance.
   * @return {!BaseFilterManager}
   * @override
   */
  static getInstance() {
    if (!instance) {
      instance = new FilterManager();
      BaseFilterManager.setInstance(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {BaseFilterManager} value
   * @override
   */
  static setInstance(value) {
    instance = value;
    BaseFilterManager.setInstance(value);
  }
}

/**
 * Global instance.
 * @type {BaseFilterManager|undefined}
 */
let instance;
