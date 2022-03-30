goog.declareModuleId('os.source');

import Feature from 'ol/src/Feature.js';
import Property from 'ol/src/layer/Property.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import ColumnDefinition from '../data/columndefinition.js';
import DataManager from '../data/datamanager.js';
import DataEventType from '../data/event/dataeventtype.js';
import RecordField from '../data/recordfield.js';
import * as dispatcher from '../dispatcher.js';
import {isInternalField} from '../feature/feature.js';
import Fields from '../fields/fields.js';
import IFilterable from '../filter/ifilterable.js';
import osImplements from '../implements.js';
import {identifyLayer} from '../layer/layer.js';
import {getMapContainer} from '../map/mapinstance.js';
import {debounce} from '../os.js';
import {getFilterManager} from '../query/queryinstance.js';
import ITime from '../time/itime.js';
import TimelineController from '../time/timelinecontroller.js';
import {numerateNameCompare} from '../ui/slick/column.js';

const Timer = goog.require('goog.Timer');
const {defaultCompare} = goog.require('goog.array');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');

const {default: VectorLayer} = goog.requireType('os.layer.Vector');
const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');
const {default: ISource} = goog.requireType('os.source.ISource');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * @typedef {function(Feature):boolean}
 */
export let FeatureHoverFn;

/**
 * Container for refresh timers. This is useful for keeping all sources set to a particular refresh interval refreshing
 * at the same time.
 * @type {Object<number, Timer>}
 */
export const RefreshTimers = {};

/**
 * Identifies a vector source by flashing it on and off. This takes into account an animation overlay
 * if the source is using one to render features.
 *
 * @param {VectorSource} source
 */
export const identifySource = function(source) {
  var overlay = source.getAnimationOverlay();
  if (overlay && !getMapContainer().is3DEnabled()) {
    // 2D (OL) will blink the entire layer regardless of what's in the timeline window
    // so we need to add and remove the exact features
    var tickCount = 0;
    var oldFeatures = overlay.getFeatures().splice(0, overlay.getFeatures().length);
    if (oldFeatures && oldFeatures.length > 0) {
      var featureTimer = new Timer(250);
      var toggleFeatures = function() {
        if (tickCount > 5) {
          overlay.setFeatures(oldFeatures);
          featureTimer.dispose();
        } else {
          var newFeatures = tickCount % 2 ? oldFeatures : null;
          overlay.setFeatures(newFeatures);
          tickCount++;
        }
      };

      featureTimer.listen(Timer.TICK, toggleFeatures);
      featureTimer.start();
    }
  } else {
    var layer = /** @type {VectorLayer} */ (getMapContainer().getLayer(source.getId()));
    if (layer) {
      identifyLayer(layer);
    }
  }
};

/**
 * Get the filterable columns on a source.
 *
 * @param {ISource} source The source.
 * @param {boolean=} opt_local If local columns should be included.
 * @param {boolean=} opt_includeTime If the time column should be included.
 * @return {Array<!ColumnDefinition>} The columns.
 */
export const getFilterColumns = function(source, opt_local, opt_includeTime) {
  var columns = null;

  if (source) {
    if (opt_local) {
      columns = source.getColumnsArray();

      if (columns && columns.length > 0) {
        // do not include the TIME column or any column with a datetime type by default for filtering
        var re = /datetime/i;
        columns = columns.filter(function(col) {
          return col['field'] !== RecordField.TIME && col['field'] !== Fields.TIME && !re.test(col['type']);
        });

        if (opt_includeTime && source.getTimeEnabled()) {
          // add in a phony time column to represent the {@link RecordField.TIME} on features
          // use a different logical type (recordtime vs. datetime) to distinguish this field from regular time fields
          var timeCol = new ColumnDefinition(Fields.TIME, RecordField.TIME);
          timeCol['type'] = 'recordtime';
          columns.push(timeCol);
        }

        columns.sort(numerateNameCompare);
      }
    }

    if (!columns) {
      var filterable = getFilterManager().getFilterable(source.getId());
      if (filterable) {
        columns = filterable.getFilterColumns().map(featureTypesToDefinitions);
      }
    }
  }

  return columns;
};

/**
 * @param {!FeatureTypeColumn} c The feature type column to convert
 * @return {!ColumnDefinition}
 */
export const featureTypesToDefinitions = function(c) {
  var col = new ColumnDefinition(c.name);
  col['type'] = c.type;
  return col;
};

/**
 * @param {!ColumnDefinition} c The feature type column to convert
 * @return {!FeatureTypeColumn}
 */
export const definitionsToFeatureTypes = function(c) {
  return {name: c['name'], type: c['type']};
};

/**
 * @param {ISource} source
 * @return {boolean}
 */
export const isFilterable = function(source) {
  if (source) {
    var id = source.getId();
    var descriptor = DataManager.getInstance().getDescriptor(id);
    if (descriptor && osImplements(descriptor, IFilterable.ID)) {
      return (
        /** @type {IFilterable} */
        (descriptor).isFilterable()
      );
    } else {
      var layer = getMapContainer().getLayer(id);
      if (layer && osImplements(layer, IFilterable.ID)) {
        return (
          /** @type {IFilterable} */
          (layer).isFilterable()
        );
      }
    }
  }

  return false;
};

/**
 * If a source is enabled.
 * @param {ISource} source The source.
 * @return {boolean}
 */
export const isEnabled = function(source) {
  return !!source && source.isEnabled();
};

/**
 * If a source is visible.
 * @param {ISource} source The source.
 * @return {boolean}
 */
export const isVisible = function(source) {
  return !!source && source.getVisible();
};

/**
 * Compares sources by title.
 *
 * @param {ISource} a A source
 * @param {ISource} b Another source
 * @return {number} The comparison
 */
export const titleCompare = function(a, b) {
  return defaultCompare(a.getTitle(), b.getTitle());
};

/**
 * Compares sources by z-index in descending order.
 *
 * @param {OLSource} a A source
 * @param {OLSource} b Another source
 * @return {number} The comparison
 */
export const zIndexCompare = function(a, b) {
  var aZ = a.get(Property.Z_INDEX) || 0;
  var bZ = b.get(Property.Z_INDEX) || 0;
  return defaultCompare(bZ, aZ);
};

/**
 * Retrieve the time field from a feature.
 *
 * @param {Object} item The feature
 * @return {?ITime} The record time, or null if held or not defined
 */
export const getRecordTime = function(item) {
  if (item instanceof Feature) {
    var time = item.get(RecordField.TIME);
    var tlc = TimelineController.getInstance();

    // return if a ITime instance and not in the held range
    if (osImplements(time, ITime.ID)) {
      time = /** @type {ITime} */ (time);

      if (!tlc.holdRangeContainsTime(time)) {
        return time;
      }
    }
  }

  return null;
};

/**
 * Retrieve the hold records time field from a feature.
 *
 * @param {Object} item The feature
 * @return {?ITime} The record time, or null if not within the held range
 */
export const getHoldRecordTime = function(item) {
  if (item instanceof Feature) {
    var time = item.get(RecordField.TIME);
    var tlc = TimelineController.getInstance();

    // return if a ITime instance and in the held range
    if (osImplements(time, ITime.ID)) {
      time = /** @type {ITime} */ (time);

      if (tlc.holdRangeContainsTime(time)) {
        return time;
      }
    }
  }

  return null;
};

/**
 * Get the fields to export for features in the source.
 *
 * @param {VectorSource} source The source
 * @param {boolean=} opt_internal If internal fields should be included
 * @param {boolean=} opt_includeTime If the time field should be included
 * @return {Array<string>} The fields to export
 */
export const getExportFields = function(source, opt_internal, opt_includeTime) {
  var fields = null;

  if (source) {
    var columns = source.getColumnsArray();
    if (columns && columns.length > 0) {
      fields = [];

      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var field = column['field'];

        //
        // omit columns that:
        //  - are hidden from view
        //  - have an empty field, including only whitespace
        //  - already in the list
        //  - are internal to opensphere (unless specified otherwise)
        //
        if (column['visible'] &&
            !isEmptyOrWhitespace(makeSafe(field)) &&
            !fields.includes(field) &&
            (opt_internal || !isInternalField(field) ||
            (opt_includeTime && field == RecordField.TIME))) {
          fields.push(field);
        }
      }
    }
  }

  return fields;
};

/**
 * Stops any import process currently occuring and fires an event that the max feature count has been hit
 * @param {number} count
 */
export const handleMaxFeatureCount = debounce(function(count) {
  dispatcher.getInstance().dispatchEvent(DataEventType.MAX_FEATURES);
  var warning = 'The maximum feature count for the application has been reached (' + count + '). ' +
      'Further features will not be added until some are removed. Consider narrowing your time range, ' +
      'applying filters, shrinking your query areas, or removing some feature layers.';

  // when supported, prompt the user to try 3D mode if they are in 2D
  var mm = getMapContainer();
  if (!mm.is3DEnabled() && mm.is3DSupported()) {
    warning += ' Switching to 3D mode will also allow more data to be loaded. To enable 3D mode, right-click the map ' +
        'and choose Toggle 2D/3D Mode.';
  }

  AlertManager.getInstance().sendAlert(warning, AlertEventSeverity.WARNING);
}, 5000, true);
