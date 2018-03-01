goog.provide('os.source');

goog.require('goog.Timer');
goog.require('ol.layer.Property');
goog.require('os');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.RecordField');
goog.require('os.data.event.DataEventType');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.map');
goog.require('os.time.ITime');
goog.require('os.ui.slick.column');


/**
 * @typedef {function(ol.Feature):boolean}
 */
os.source.FeatureHoverFn;


/**
 * Container for refresh timers. This is useful for keeping all sources set to a particular refresh interval refreshing
 * at the same time.
 * @type {Object<number, goog.Timer>}
 */
os.source.RefreshTimers = {};


/**
 * Identifies a vector source by flashing it on and off. This takes into account an animation overlay
 * if the source is using one to render features.
 * @param {os.source.Vector} source
 */
os.source.identifySource = function(source) {
  var overlay = source.getAnimationOverlay();
  if (overlay && os.map.mapContainer && !os.map.mapContainer.is3DEnabled()) {
    // 2D (Openlayers) will blink the entire layer regardless of what's in the timeline window
    // so we need to add and remove the exact features
    var tickCount = 0;
    var oldFeatures = overlay.getFeatures().splice(0, overlay.getFeatures().length);
    if (oldFeatures && oldFeatures.length > 0) {
      var featureTimer = new goog.Timer(250);
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

      featureTimer.listen(goog.Timer.TICK, toggleFeatures);
      featureTimer.start();
    }
  } else if (os.map.mapContainer) {
    var layer = /** @type {os.layer.Vector} */ (os.map.mapContainer.getLayer(source.getId()));
    if (layer) {
      os.layer.identifyLayer(layer);
    }
  }
};


/**
 * Get the filterable columns on a source.
 * @param {os.source.ISource} source The source.
 * @param {boolean=} opt_local If local columns should be included.
 * @return {Array<!os.data.ColumnDefinition>} The columns.
 */
os.source.getFilterColumns = function(source, opt_local) {
  var columns = null;

  if (source) {
    if (opt_local) {
      columns = source.getColumns();

      if (columns && columns.length > 0) {
        // this both creates a copy of the array so source columns aren't sorted, and removes the TIME column since
        // filters won't play well with it.
        columns = columns.filter(function(col) {
          return col['field'] !== os.data.RecordField.TIME;
        });

        columns.sort(os.ui.slick.column.numerateNameCompare);
      }
    }

    if (!columns) {
      var filterable = os.ui.filter.FilterManager.getInstance().getFilterable(source.getId());
      if (filterable) {
        columns = filterable.getFilterColumns().map(os.source.mapFilterColumns);
      }
    }
  }

  return columns;
};


/**
 * @param {!os.ogc.FeatureTypeColumn} c The feature type column to convert
 * @return {!os.data.ColumnDefinition}
 */
os.source.mapFilterColumns = function(c) {
  var col = new os.data.ColumnDefinition(c.name);
  col['type'] = c.type;
  return col;
};


/**
 * @param {os.source.ISource} source
 * @return {boolean}
 */
os.source.isFilterable = function(source) {
  if (source) {
    var id = source.getId();
    var descriptor = os.dataManager.getDescriptor(id);
    if (descriptor && os.implements(descriptor, os.filter.IFilterable.ID)) {
      return /** @type {os.filter.IFilterable} */ (descriptor).isFilterable();
    } else if (os.map.mapContainer) {
      var layer = os.map.mapContainer.getLayer(id);
      if (layer && os.implements(layer, os.filter.IFilterable.ID)) {
        return /** @type {os.filter.IFilterable} */ (layer).isFilterable();
      }
    }
  }

  return false;
};


/**
 * @param {os.source.ISource} source
 * @return {boolean}
 */
os.source.isVisible = function(source) {
  return !!source && source.getVisible();
};


/**
 * Compares sources by title.
 * @param {os.source.ISource} a A source
 * @param {os.source.ISource} b Another source
 * @return {number} The comparison
 */
os.source.titleCompare = function(a, b) {
  return goog.array.defaultCompare(a.getTitle(), b.getTitle());
};


/**
 * Compares sources by z-index in descending order.
 * @param {os.source.ISource} a A source
 * @param {os.source.ISource} b Another source
 * @return {number} The comparison
 */
os.source.zIndexCompare = function(a, b) {
  var aZ = a.get(ol.layer.Property.Z_INDEX) || 0;
  var bZ = b.get(ol.layer.Property.Z_INDEX) || 0;
  return goog.array.defaultCompare(bZ, aZ);
};


/**
 * Retrieve the time field from a feature.
 * @param {Object} item The feature
 * @return {?os.time.ITime} The record time, or null if held or not defined
 */
os.source.getRecordTime = function(item) {
  if (item instanceof ol.Feature) {
    var time = item.get(os.data.RecordField.TIME);
    var tlc = os.time.TimelineController.getInstance();

    // return if a os.time.ITime instance and not in the held range
    if (os.implements(time, os.time.ITime.ID)) {
      time = /** @type {os.time.ITime} */ (time);

      if (!tlc.holdRangeContainsTime(time)) {
        return time;
      }
    }
  }

  return null;
};


/**
 * Retrieve the hold records time field from a feature.
 * @param {Object} item The feature
 * @return {?os.time.ITime} The record time, or null if not within the held range
 */
os.source.getHoldRecordTime = function(item) {
  if (item instanceof ol.Feature) {
    var time = item.get(os.data.RecordField.TIME);
    var tlc = os.time.TimelineController.getInstance();

    // return if a os.time.ITime instance and in the held range
    if (os.implements(time, os.time.ITime.ID)) {
      time = /** @type {os.time.ITime} */ (time);

      if (tlc.holdRangeContainsTime(time)) {
        return time;
      }
    }
  }

  return null;
};


/**
 * Get the fields to export for features in the source.
 * @param {os.source.Vector} source The source
 * @param {boolean=} opt_internal If internal fields should be included
 * @return {Array<string>} The fields to export
 */
os.source.getExportFields = function(source, opt_internal) {
  var fields = null;

  if (source) {
    var columns = source.getColumns();
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
            !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(field)) &&
            !goog.array.contains(fields, field) &&
            (opt_internal || !os.feature.isInternalField(field))) {
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
os.source.handleMaxFeatureCount = os.debounce(function(count) {
  os.dispatcher.dispatchEvent(os.data.event.DataEventType.MAX_FEATURES);
  var warning = 'The maximum feature count for the application has been reached (' + count + '). ' +
      'Further features will not be added until some are removed. Consider narrowing your time range, ' +
      'applying filters, shrinking your query areas, or removing some feature layers.';

  // when supported, prompt the user to try 3D mode if they are in 2D
  var mc = os.map.mapContainer;
  if (mc && !mc.is3DEnabled() && mc.is3DSupported()) {
    warning += ' Switching to 3D mode will also allow more data to be loaded. To enable 3D mode, right-click the map ' +
        'and choose Toggle 2D/3D Mode.';
  }

  os.alert.AlertManager.getInstance().sendAlert(warning, os.alert.AlertEventSeverity.WARNING);
}, 5000, true);
