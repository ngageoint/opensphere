goog.declareModuleId('plugin.vectortools');

import ColumnMappingManager from '../../os/column/columnmappingmanager.js';
import DataManager from '../../os/data/datamanager.js';
import RecordField from '../../os/data/recordfield.js';
import IFilterable from '../../os/filter/ifilterable.js';
import osImplements from '../../os/implements.js';
import * as layer from '../../os/layer/layer.js';
import VectorLayer from '../../os/layer/vector.js';
import MapContainer from '../../os/mapcontainer.js';
import VectorSource from '../../os/source/vectorsource.js';
import StyleType from '../../os/style/styletype.js';
import Options from './options.js';

const googArray = goog.require('goog.array');
const googString = goog.require('goog.string');


/**
 * The currently selected option.
 * @type {Options}
 */
let option = Options.SHOWN;


/**
 * Get the currently selected option.
 * @return {Options}
 */
export const getOption = () => option;

/**
 * Set the currently selected option.
 * @param {Options} value The option.
 */
export const setOption = (value) => {
  option = value;
};

/**
 * @param {VectorSource} source The vector source
 * @param {Options=} opt_which Which features to retrieve
 * @return {Array<!Feature>} the features
 */
export const getFeatures = function(source, opt_which) {
  opt_which = opt_which || option;

  switch (opt_which) {
    case Options.ALL:
      return source.getFeatures();
    case Options.SHOWN:
      return source.getFilteredFeatures();
    case Options.SELECTED:
      return source.getSelectedItems();
    case Options.UNSELECTED:
      return source.getUnselectedItems();
    case Options.HIDDEN:
      return source.getHiddenItems();
    default:
      return [];
  }
};

/**
 * @param {string} sourceId
 * @return {function(Feature):Feature} map function used for cloning lists of features
 */
export const getFeatureCloneFunction = function(sourceId) {
  /**
   * @param {Feature} feature Original feature
   * @return {Feature} copied feature
   */
  var cloneFunc = function(feature) {
    var newFeature = feature.clone();
    newFeature.suppressEvents();
    newFeature.set(RecordField.SOURCE_ID, sourceId, false);
    newFeature.unset(StyleType.SELECT, false);
    newFeature.unset(StyleType.HIGHLIGHT, false);
    newFeature.enableEvents();
    return newFeature;
  };

  return cloneFunc;
};

/**
 * Creates a new layer and returns it.
 *
 * @param {(string|Object)=} opt_restoreFromIdOrConfig An optional layerId or config to restore from
 * @return {VectorLayer}
 */
export const addNewLayer = function(opt_restoreFromIdOrConfig) {
  var mm = MapContainer.getInstance();
  var id = googString.getRandomString();
  var newSource = new VectorSource();
  newSource.setId(id);

  var newLayer = new VectorLayer({
    source: newSource
  });
  newLayer.setId(id);
  newSource.setTitle(newLayer.getTitle());
  mm.addLayer(newLayer);

  if (opt_restoreFromIdOrConfig) {
    if (typeof opt_restoreFromIdOrConfig === 'string') {
      // get the other layer and restore the new one from it
      var otherLayer = /** @type {ILayer} */ (mm.getLayer(opt_restoreFromIdOrConfig));
      if (otherLayer) {
        newLayer.restore(otherLayer.persist());

        var title = layer.getUniqueTitle(otherLayer.getTitle());
        newLayer.setTitle(title);
        newSource.setTitle(title);
      }
    } else {
      newLayer.restore(opt_restoreFromIdOrConfig);
    }
  }

  // we don't want the node checkbox visible -- that just deletes the merged/copied/joined features permanently
  let opts = newLayer.getLayerOptions();
  if (opts) {
    opts['hideDisable'] = true;
  } else {
    opts = {'hideDisable': true};
  }
  newLayer.setLayerOptions(opts);

  return newLayer;
};

/**
 * Gets a map of applicable column mappings to a set of sourceIds.
 *
 * @param {!Array<string>} sourceIds The list of source ids
 * @return {!Object<string, !Object<string, string>>} map of sourceIds to columns that should change
 */
export const getColumnMappings = function(sourceIds) {
  var filterKeys = sourceIds.map(mapIdToFilterKey_);
  var mappings = ColumnMappingManager.getInstance().getAll();

  /**
   * Filter mappings to only those which apply to at least two of the sources
   *
   * @param {number} count
   * @param {osx.column.ColumnModel} col
   * @return {number}
   */
  var countValidKeys = function(count, col) {
    return filterKeys.indexOf(col['layer']) > -1 ? count + 1 : count;
  };

  /**
   * Filter out column models that reference layers not in filterKeys
   *
   * @param {osx.column.ColumnModel} col
   * @return {boolean}
   */
  var filterColumns = function(col) {
    return filterKeys.indexOf(col['layer']) > -1;
  };

  /**
   * Sort by the layer/source id order we were given
   *
   * @param {osx.column.ColumnModel} a
   * @param {osx.column.ColumnModel} b
   * @return {number}
   */
  var sortColumns = function(a, b) {
    var ai = filterKeys.indexOf(a['layer']);
    var bi = filterKeys.indexOf(b['layer']);
    return googArray.defaultCompare(ai, bi);
  };

  /**
   * Replace filterKeys with sourceIds
   *
   * @param {osx.column.ColumnModel} col
   * @return {osx.column.ColumnModel}
   */
  var replaceKey = function(col) {
    var i = filterKeys.indexOf(col['layer']);

    return {
      'column': col['column'],
      'layer': sourceIds[i],
      'unit': col['unit']
    };
  };

  // this will hold the current replacement field found by reduceMap
  var replaceField = null;

  /**
   * @param {Object<string, Object<string, string>>} map
   * @param {osx.column.ColumnModel} col
   * @return {Object<string, Object<string, string>>}
   */
  var reduceMap = function(map, col) {
    if (!replaceField) {
      replaceField = col['column'];
    } else {
      if (!(col['layer'] in map)) {
        map[col['layer']] = {};
      }

      map[col['layer']][col['column']] = replaceField;
    }

    return map;
  };

  return mappings.filter(function(mapping) {
    return mapping.getColumns().reduce(countValidKeys, 0) > 1;
  }).reduce(function(map, mapping) {
    replaceField = null;
    return mapping.getColumns().
        filter(filterColumns).
        map(replaceKey).
        sort(sortColumns).
        reduce(reduceMap, map);
  }, {});
};

/**
 * @param {string} id The source id
 * @return {?string} The filter key
 */
const mapIdToFilterKey_ = function(id) {
  var d = DataManager.getInstance().getDescriptor(id);

  if (d && osImplements(d, IFilterable.ID)) {
    return /** @type {IFilterable} */ (d).getFilterKey();
  }

  return id;
};

/**
 * Runs a column mapping on a feature.
 *
 * @param {Object<string, string>} mapping
 * @param {Feature} feature
 */
export const runColumnMapping = function(mapping, feature) {
  if (mapping) {
    for (var key in mapping) {
      var newKey = mapping[key];

      // non-destructive copy
      if (feature.get(newKey) === undefined) {
        feature.set(newKey, feature.get(key), true);
        feature.unset(key);
      }
    }
  }
};

/**
 * Returns the combined columns between several sources. Accounts for column mappings and columns that just
 * happen to be identical.
 *
 * @param {!Array<!VectorSource>} sources
 * @param {!Object<string, !Object<string, string>>} mappings
 * @return {!Array<!ColumnDefinition|string>}
 */
export const getCombinedColumns = function(sources, mappings) {
  return sources.reduce(function(columns, source) {
    var filter = function(column) {
      if (typeof column === 'string') {
        return columns.indexOf(column) === -1;
      }

      for (var i = 0, n = columns.length; i < n; i++) {
        if (typeof columns[i] !== 'string' && columns[i]['field'] === column['field']) {
          return false;
        }
      }

      return true;
    };

    return columns.concat(source.getColumnsArray().filter(filter));
  }, []).filter(function(column) {
    var field = typeof column === 'string' ? column : column['field'];

    for (var id in mappings) {
      var assocs = mappings[id];

      if (field in assocs && field !== assocs[field]) {
        return false;
      }
    }

    return true;
  }).map(function(column) {
    // clone every resulting column, otherwise they will be bound together by reference
    return column.clone();
  });
};
