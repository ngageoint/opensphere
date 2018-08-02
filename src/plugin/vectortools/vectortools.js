goog.provide('plugin.vectortools');
goog.provide('plugin.vectortools.Icons');
goog.provide('plugin.vectortools.Options');
goog.require('goog.string');
goog.require('os.MapContainer');
goog.require('os.column.ColumnMappingManager');
goog.require('os.data.DataManager');
goog.require('os.layer.Vector');
goog.require('os.source.Vector');
goog.require('plugin.vectortools.joinDirective');
goog.require('plugin.vectortools.mergeDirective');


/**
 * Icons for the vectortools actions.
 * @enum {string}
 */
plugin.vectortools.Icons = {
  COPY_ICON: 'fa-copy',
  MERGE_ICON: 'fa-compress',
  JOIN_ICON: 'fa-object-group'
};


/**
 * @enum {number}
 */
plugin.vectortools.Options = {
  ALL: 0,
  SHOWN: 1,
  SELECTED: 2,
  UNSELECTED: 3,
  HIDDEN: 4
};


/**
 * @type {plugin.vectortools.Options}
 */
plugin.vectortools.option = plugin.vectortools.Options.SHOWN;


/**
 * @param {os.source.Vector} source The vector source
 * @param {plugin.vectortools.Options=} opt_which Which features to retrieve
 * @return {Array<!ol.Feature>} the features
 */
plugin.vectortools.getFeatures = function(source, opt_which) {
  opt_which = opt_which || plugin.vectortools.option;

  switch (opt_which) {
    case plugin.vectortools.Options.ALL:
      return source.getFeatures();
    case plugin.vectortools.Options.SHOWN:
      return source.getFilteredFeatures();
    case plugin.vectortools.Options.SELECTED:
      return source.getSelectedItems();
    case plugin.vectortools.Options.UNSELECTED:
      return source.getUnselectedItems();
    case plugin.vectortools.Options.HIDDEN:
      return source.getHiddenItems();
    default:
      return [];
  }
};


/**
 * @param {string} sourceId
 * @return {function(ol.Feature):ol.Feature} map function used for cloning lists of features
 */
plugin.vectortools.getFeatureCloneFunction = function(sourceId) {
  /**
   * @param {ol.Feature} feature Original feature
   * @return {ol.Feature} copied feature
   */
  var cloneFunc = function(feature) {
    var newFeature = feature.clone();
    newFeature.suppressEvents();
    newFeature.set(os.data.RecordField.SOURCE_ID, sourceId, false);
    newFeature.unset(os.style.StyleType.SELECT, false);
    newFeature.unset(os.style.StyleType.HIGHLIGHT, false);
    newFeature.enableEvents();
    return newFeature;
  };

  return cloneFunc;
};


/**
 * Creates a new layer and returns it.
 * @param {(string|Object)=} opt_restoreFromIdOrConfig An optional layerId or config to restore from
 * @return {os.layer.Vector}
 */
plugin.vectortools.addNewLayer = function(opt_restoreFromIdOrConfig) {
  var mm = os.MapContainer.getInstance();
  var id = goog.string.getRandomString();
  var newSource = new os.source.Vector();
  newSource.setId(id);

  var newLayer = new os.layer.Vector({
    source: newSource
  });
  newLayer.setId(id);
  newSource.setTitle(newLayer.getTitle());
  mm.addLayer(newLayer);

  if (opt_restoreFromIdOrConfig) {
    if (goog.isString(opt_restoreFromIdOrConfig)) {
      // get the other layer and restore the new one from it
      var otherLayer = /** @type {os.layer.ILayer} */ (mm.getLayer(opt_restoreFromIdOrConfig));
      if (otherLayer) {
        newLayer.restore(otherLayer.persist());

        var title = os.layer.getUniqueTitle(otherLayer.getTitle());
        newLayer.setTitle(title);
        newSource.setTitle(title);
      }
    } else {
      newLayer.restore(opt_restoreFromIdOrConfig);
    }
  }

  return newLayer;
};


/**
 * Gets a map of applicable column mappings to a set of sourceIds.
 * @param {!Array<string>} sourceIds The list of source ids
 * @return {!Object<string, !Object<string, string>>} map of sourceIds to columns that should change
 */
plugin.vectortools.getColumnMappings = function(sourceIds) {
  var filterKeys = sourceIds.map(plugin.vectortools.mapIdToFilterKey_);
  var mappings = os.column.ColumnMappingManager.getInstance().getAll();

  /**
   * Filter mappings to only those which apply to at least two of the sources
   * @param {number} count
   * @param {os.column.ColumnModel} col
   * @return {number}
   */
  var countValidKeys = function(count, col) {
    return filterKeys.indexOf(col['layer']) > -1 ? count + 1 : count;
  };

  /**
   * Filter out column models that reference layers not in filterKeys
   * @param {os.column.ColumnModel} col
   * @return {boolean}
   */
  var filterColumns = function(col) {
    return filterKeys.indexOf(col['layer']) > -1;
  };

  /**
   * Sort by the layer/source id order we were given
   * @param {os.column.ColumnModel} a
   * @param {os.column.ColumnModel} b
   * @return {number}
   */
  var sortColumns = function(a, b) {
    var ai = filterKeys.indexOf(a['layer']);
    var bi = filterKeys.indexOf(b['layer']);
    return goog.array.defaultCompare(ai, bi);
  };

  /**
   * Replace filterKeys with sourceIds
   * @param {os.column.ColumnModel} col
   * @return {os.column.ColumnModel}
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
   * @param {os.column.ColumnModel} col
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
 * @private
 */
plugin.vectortools.mapIdToFilterKey_ = function(id) {
  var d = os.dataManager.getDescriptor(id);

  if (d && os.implements(d, os.filter.IFilterable.ID)) {
    return /** @type {os.filter.IFilterable} */ (d).getFilterKey();
  }

  return id;
};


/**
 * Runs a column mapping on a feature.
 * @param {Object<string, string>} mapping
 * @param {ol.Feature} feature
 */
plugin.vectortools.runColumnMapping = function(mapping, feature) {
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
 * @param {!Array<!os.source.Vector>} sources
 * @param {!Object<string, !Object<string, string>>} mappings
 * @return {!Array<!os.data.ColumnDefinition|string>}
 */
plugin.vectortools.getCombinedColumns = function(sources, mappings) {
  return sources.reduce(function(columns, source) {
    var filter = function(column) {
      if (goog.isString(column)) {
        return columns.indexOf(column) === -1;
      }

      for (var i = 0, n = columns.length; i < n; i++) {
        if (!goog.isString(columns[i]) && columns[i]['field'] === column['field']) {
          return false;
        }
      }

      return true;
    };

    return columns.concat(source.getColumns().filter(filter));
  }, []).filter(function(column) {
    var field = goog.isString(column) ? column : column['field'];

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


/**
 * Launches the Merge Layer window.
 * @param {Array<string>} sourceIds The source/layer IDs to merge
 */
plugin.vectortools.launchMergeWindow = function(sourceIds) {
  var title = 'Merge ' + sourceIds.length + ' Layers';
  os.ui.window.create({
    'label': title,
    'icon': 'fa ' + plugin.vectortools.Icons.MERGE_ICON,
    'no-scroll': 'true',
    'x': 'center',
    'y': 'center',
    'width': '400',
    'height': 'auto',
    'show-close': true
  }, '<merge></merge>', undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};


/**
 * Launches the Join Layer window.
 * @param {Array<string>} sourceIds The source/layer IDs to join
 */
plugin.vectortools.launchJoinWindow = function(sourceIds) {
  var title = 'Join ' + sourceIds.length + ' Layers';
  os.ui.window.create({
    'label': title,
    'icon': 'fa ' + plugin.vectortools.Icons.JOIN_ICON,
    'no-scroll': 'true',
    'x': 'center',
    'y': 'center',
    'width': '500',
    'height': 'auto',
    'show-close': true
  }, '<join></join>', undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};
