goog.provide('os.ui.query.AreaManager');

goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('os.data.CollectionManager');
goog.require('os.data.RecordField');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.geo.jsts');
goog.require('os.map');
goog.require('os.map.IMapContainer');
goog.require('os.mixin.geometry');
goog.require('os.storage');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.HTML5LocalStorage');
goog.require('os.storage.IDBStorage');
goog.require('os.style.area');
goog.require('os.ui.window');



/**
 * Manages spatial areas
 * @extends {os.data.CollectionManager<!ol.Feature>}
 * @constructor
 */
os.ui.query.AreaManager = function() {
  os.ui.query.AreaManager.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.query.AreaManager.LOGGER_;

  /**
   * @type {boolean}
   * @private
   */
  this.mapReady_ = false;

  // the check is here for unit tests
  if (this.getMap()) {
    this.getMap().listen('map:ready', this.onMapReady_, false, this);
  }

  /**
   * @type {ol.ProjectionLike}
   * @private
   */
  this.loadProj_ = null;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.saveDelay_ = new goog.async.Delay(this.save, 100, this);

  /**
   * @type {os.storage.AsyncStorage<Object>}
   * @protected
   */
  this.storage = new os.storage.IDBStorage(os.SHARED_STORE_NAME, os.SHARED_DB_NAME);
  this.storage.init().addCallbacks(this.onStorageReady, this.onStorageError, this);
};
goog.inherits(os.ui.query.AreaManager, os.data.CollectionManager);
goog.addSingletonGetter(os.ui.query.AreaManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.ui.query.AreaManager.LOGGER_ = goog.log.getLogger('os.ui.query.AreaManager');


/**
 * Drawing layer ID
 * @type {string}
 */
os.ui.query.DRAW_ID = 'draw';


/**
 * Prefix for areas
 * @type {string}
 * @const
 */
os.ui.query.AreaManager.FEATURE_PREFIX = 'area_';


/**
 * @define {string} Area manager's storage save key
 */
goog.define('os.AREA_STORAGE_KEY', 'areas');


/**
 * @type {number}
 * @private
 */
os.ui.query.AreaManager.tempId_ = 1;


/**
 * Handle successful IndexedDB storage initialization.
 * @protected
 */
os.ui.query.AreaManager.prototype.onStorageReady = function() {
  this.migrateAreasFromLsToIdb_();
  this.migrateAreasFromIdbToSettings_().addCallbacks(this.load, this.onStorageError, this);
};


/**
 * Migrate areas from localStorage to IndexedDb
 * @private
 */
os.ui.query.AreaManager.prototype.migrateAreasFromLsToIdb_ = function() {
  // look for areas in local storage first and add them to the manager
  var oldStorage = new os.storage.HTML5LocalStorage();
  var oldAreas = oldStorage.get(os.AREA_STORAGE_KEY);
  if (oldAreas) {
    try {
      var format = new ol.format.GeoJSON();
      var areas = /** @type {Array<!ol.Feature>} */ (format.readFeatures(oldAreas));
      if (areas) {
        goog.log.info(this.log, 'Migrating ' + areas.length + ' areas from local storage to IndexedDB.');
        this.bulkAdd(areas);
      }
    } catch (e) {
      goog.log.error(this.log, 'Failed migrating old areas from local storage!', e);
    }

    // remove the old value so it won't be handled again and we can free up some space
    oldStorage.remove(os.AREA_STORAGE_KEY);
  }
};


/**
 * Migrate areas from localStorage to IndexedDb
 * @return {goog.async.Deferred}
 * @private
 */
os.ui.query.AreaManager.prototype.migrateAreasFromIdbToSettings_ = function() {
  return this.storage.get(os.AREA_STORAGE_KEY)
      .addCallbacks(this.onMigrateAreasLoaded_, this.onStorageError, this);
};


/**
 * Handle deferred callback of areas loaded from async storage device.  Persist them to settings service
 * @param {Object} obj
 * @private
 */
os.ui.query.AreaManager.prototype.onMigrateAreasLoaded_ = function(obj) {
  if (obj) {
    os.settings.set(os.AREA_STORAGE_KEY, obj);
  }
  if (this.storage) {
    // clear this storage key out of the old storage, DO NOT CLEAR IT!!!!!!
    this.storage.remove(os.AREA_STORAGE_KEY).addCallback(this.storage.dispose, this.storage);
  }
};


/**
 * Handle IndexedDB storage error, degrading to using local storage.
 * @param {goog.db.Error} error The error.
 * @protected
 */
os.ui.query.AreaManager.prototype.onStorageError = function(error) {
  if (this.storage) {
    this.storage.dispose();
    this.storage = new os.storage.AsyncStorageWrapper(new os.storage.HTML5LocalStorage());
    this.load();
  }
};


/**
 * Handles map ready
 * @private
 */
os.ui.query.AreaManager.prototype.onMapReady_ = function() {
  this.mapReady_ = true;

  var areas = this.getAll();
  for (var i = 0, n = areas.length; i < n; i++) {
    var feature = areas[i];
    // we load the areas from settings before the map/projection is ready, so
    // transform it
    feature.getGeometry().osTransform(this.loadProj_);
    var show = /** @type {boolean} */ (feature.get('shown'));
    this.toggle(feature, goog.isDef(show) ? show : true);
  }

  var qm = os.ui.query.QueryManager.getInstance();
  qm.listen(goog.events.EventType.PROPERTYCHANGE, this.updateStyles_, false, this);
  this.updateStyles_();
};


/**
 * Handles map ready
 * @private
 */
os.ui.query.AreaManager.prototype.onMapUnready_ = function() {
  this.mapReady_ = false;
  var qm = os.ui.query.QueryManager.getInstance();
  qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateStyles_, false, this);
};


/**
 * Gets the map reference relevant to this area manager.
 * @return {os.map.IMapContainer}
 */
os.ui.query.AreaManager.prototype.getMap = function() {
  return this.map_;
};


/**
 * Sets the map reference relevant to this area manager.
 * @param {os.map.IMapContainer} map
 */
os.ui.query.AreaManager.prototype.setMap = function(map) {
  if (this.getMap()) {
    this.getMap().unlisten('map:ready', this.onMapReady_, false, this);
    this.onMapUnready_();
  }

  this.map_ = map;

  if (this.getMap()) {
    this.onMapReady_();
    this.getMap().listen('map:ready', this.onMapReady_, false, this);
  }
};


/**
 * @inheritDoc
 */
os.ui.query.AreaManager.prototype.getId = function(item) {
  return '' + item.getId();
};


/**
 * Add multiple areas to the model in bulk
 * @param {Array<!ol.Feature>} features
 * @param {boolean=} opt_show
 */
os.ui.query.AreaManager.prototype.bulkAdd = function(features, opt_show) {
  var show = opt_show || false;

  goog.array.forEach(features, function(feature) {
    if (!feature.getId()) {
      feature.setId(os.ui.query.AreaManager.FEATURE_PREFIX + goog.string.getRandomString());
    }
    if (!feature.get('temp') && !feature.get('title')) {
      feature.set('temp', true);
      feature.set('title', 'temp area ' + os.ui.query.AreaManager.tempId_++);
    }

    feature.set('shown', show);
    this.addInternal(feature, true);
  }, this);
  this.dispatchEvent(new os.events.PropertyChangeEvent('areas'));
};


/**
 * @inheritDoc
 */
os.ui.query.AreaManager.prototype.add = function(feature) {
  goog.asserts.assert(goog.isDef(feature), 'Cannot add null/undefined feature');

  if (!feature.getId()) {
    feature.setId(os.ui.query.AreaManager.FEATURE_PREFIX + goog.string.getRandomString());
  }

  if (!feature.get('title') && feature.get('name')) {
    // new feature, likely a file import
    feature.set('temp', true);
    feature.set('title', feature.get('name'));
  } else if (!feature.get('temp') && !feature.get('title')) {
    feature.set('temp', true);
    feature.set('title', 'temp area ' + os.ui.query.AreaManager.tempId_++);
  }

  var added = this.addInternal(feature);

  // If it didn't get added, it was probably edited. So we'll just dispatch and save on
  // every incoming item.
  this.dispatchEvent(new os.events.PropertyChangeEvent('add/edit', feature));
  this.saveDelay_.start();
  return added;
};


/**
 * Check if the feature can be used as an area. Returns true if the area is a valid Polygon/MultiPolygon, or if it can
 * be translated into one.
 * @param {!ol.Feature} feature The feature
 * @return {boolean}
 * @protected
 */
os.ui.query.AreaManager.prototype.isValidFeature = function(feature) {
  var geometry = feature.getGeometry();
  if (!geometry) {
    return false;
  }

  var isValid = false;
  var geomType = geometry.getType();
  if (geomType == ol.geom.GeometryType.POLYGON || geomType == ol.geom.GeometryType.MULTI_POLYGON) {
    var validated = os.geo.jsts.validate(geometry);
    isValid = true;

    feature.setGeometry(validated);
    feature.set(os.interpolate.ORIGINAL_GEOM_FIELD, validated);
  } else {
    try {
      var polygon = os.geo.jsts.toPolygon(geometry);
      if (polygon) {
        feature.setGeometry(polygon);
        isValid = true;
      }
    } catch (e) {
      goog.log.error(this.log, 'Error converting ' + geomType + ' to polygon:', e);
      isValid = false;
    }
  }

  if (isValid) {
    this.normalizeGeometry(feature);
  }

  return isValid;
};


/**
 * @param {ol.Feature} feature
 * @protected
 */
os.ui.query.AreaManager.prototype.normalizeGeometry = function(feature) {
  os.geo.normalizeGeometryCoordinates(feature.getGeometry());
};


/**
 * filter the list of features to only include valid areas
 * @param {Array<ol.Feature>} features
 * @return {Array<ol.Feature>}
 */
os.ui.query.AreaManager.prototype.filterFeatures = function(features) {
  if (features) {
    return goog.array.filter(features, function(feature) {
      return feature != null && this.isValidFeature(feature);
    }, this);
  }

  return null;
};


/**
 * @param {ol.Feature} feature
 * @param {boolean=} opt_bulk - just show/hide on bulk
 * @return {boolean}
 * @protected
 * @override
 */
os.ui.query.AreaManager.prototype.addInternal = function(feature, opt_bulk) {
  var bulk = opt_bulk || false;

  if (feature != null && this.isValidFeature(feature)) {
    feature.unset(os.data.RecordField.DRAWING_LAYER_NODE, true);

    if (os.ui.query.AreaManager.base(this, 'addInternal', feature)) {
      if (this.mapReady_) {
        var show = /** @type {boolean} */ (feature.get('shown'));
        if (bulk) {
          this.showHideFeature(feature, goog.isDef(show) ? show : true);
        } else {
          this.toggle(feature, goog.isDef(show) ? show : true);
        }
      }
      return true;
    }
  } else {
    os.alertManager.sendAlert('Area is invalid and cannot be used. Common problems include polygons that ' +
        'cross themselves and multipolygons with overlapping elements.',
        os.alert.AlertEventSeverity.WARNING);
  }

  return false;
};


/**
 * Toggles the feature on the map
 * @param {string|ol.Feature} idOrFeature
 * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
 */
os.ui.query.AreaManager.prototype.showHideFeature = function(idOrFeature, opt_toggle) {
  var feature = this.get(idOrFeature);

  if (feature) {
    var show = goog.isDef(opt_toggle) ? opt_toggle : !this.getMap().containsFeature(feature);

    feature.set('shown', show);
    if (show) {
      if (!this.getMap().containsFeature(feature)) {
        // set style
        this.setDefaultStyle(feature);

        // show it
        this.getMap().addFeature(feature);
      }
    } else {
      // remove it
      this.getMap().removeFeature(feature);
    }

    this.saveDelay_.start();
  }
};


/**
 * Show or hide all area features
 * @param {boolean} show
 */
os.ui.query.AreaManager.prototype.toggleAllFeatures = function(show) {
  var areas = this.getAll();
  for (var i = 0; i < areas.length; i = i + 1) {
    this.toggle(areas[i], show);
  }
};


/**
 * Toggles the feature on the map
 * @param {string|ol.Feature} idOrFeature
 * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
 */
os.ui.query.AreaManager.prototype.toggle = function(idOrFeature, opt_toggle) {
  this.showHideFeature(idOrFeature, opt_toggle);

  var feature = this.get(idOrFeature);
  if (feature) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('toggle', feature));
    feature.dispatchEvent('toggle'); // node needs to be notified since toggling doesn't require a search (areas.js)
  }
};


/**
 * @inheritDoc
 */
os.ui.query.AreaManager.prototype.remove = function(feature) {
  var val = os.ui.query.AreaManager.base(this, 'remove', feature);

  if (val && this.getMap()) {
    this.unhighlight(feature);
    this.getMap().removeFeature(val);
    this.saveDelay_.start();
  }

  return val;
};


/**
 * Clears all areas in the manager.
 * @return {Array<ol.Feature>} The areas that were removed.
 */
os.ui.query.AreaManager.prototype.clear = function() {
  var qm = os.ui.queryManager;
  var areas = this.getAll();
  var removed = [];

  for (var i = 0; i < areas.length; i++) {
    var area = areas[i];
    this.remove(area);
    removed.push(area);

    var entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];
    if (entries) {
      qm.removeEntriesArr(entries);
    }
  }

  return removed;
};


/**
 * Clears all the temporary areas in the manager.
 * @return {Array<ol.Feature>} The areas that were removed.
 */
os.ui.query.AreaManager.prototype.clearTemp = function() {
  var qm = os.ui.queryManager;
  var areas = this.getAll();
  var removed = [];

  for (var i = 0; i < areas.length; i++) {
    var area = areas[i];
    if (area.get('temp')) {
      this.remove(area);
      removed.push(area);
    }

    var entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];
    if (entries) {
      qm.removeEntriesArr(entries);
    }
  }

  return removed;
};


/**
 * saves the areas
 * @return {!goog.async.Deferred}
 */
os.ui.query.AreaManager.prototype.save = function() {
  // base area manager doesn't save/load, so fire the callback immediately
  return goog.async.Deferred.succeed();
};


/**
 * loads the areas
 * @return {!goog.async.Deferred<Array<ol.Feature>>}
 */
os.ui.query.AreaManager.prototype.load = function() {
  this.dispatchEvent(new os.events.PropertyChangeEvent('areas'));

  // base area manager doesn't save/load, so fire the callback immediately
  return goog.async.Deferred.succeed();
};


/**
 * Gets areas from storage
 * @return {!goog.async.Deferred<Array<ol.Feature>>}
 */
os.ui.query.AreaManager.prototype.getStoredAreas = function() {
  return goog.async.Deferred.succeed(this.onAreasLoaded_(
      /** @type {?Object} */ (os.settings.get(os.AREA_STORAGE_KEY))));
};


/**
 * Handle areas loaded from storage.
 * @param {Object} obj
 * @return {Array<!ol.Feature>}
 * @private
 */
os.ui.query.AreaManager.prototype.onAreasLoaded_ = function(obj) {
  if (obj) {
    var format = new ol.format.GeoJSON();
    this.loadProj_ = os.map.PROJECTION;

    var areas = /** @type {Array<!ol.Feature>} */ (format.readFeatures(obj, {
      featureProjection: this.loadProj_
    }));

    // normalize all areas loaded from storage - they should have been normalized by the application already
    if (areas) {
      for (var i = 0; i < areas.length; i++) {
        var geom = areas[i] ? areas[i].getGeometry() : undefined;
        if (geom) {
          geom.set(os.geom.GeometryField.NORMALIZED, true, true);
        }
      }
    }

    return areas;
  }

  return null;
};


/**
 * Sets the default style on a feature.
 * @param {ol.Feature} feature
 * @protected
 */
os.ui.query.AreaManager.prototype.setDefaultStyle = function(feature) {
  feature.setStyle(os.style.area.DEFAULT_STYLE);
};


/**
 * Updates styles based on queries in query manager
 * @private
 */
os.ui.query.AreaManager.prototype.updateStyles_ = function() {
  var areas = this.getAll();
  var changed = false;

  for (var i = 0, n = areas.length; i < n; i++) {
    if (this.updateStyle(areas[i], true)) {
      changed = true;
    }
  }

  if (changed) {
    // 2D just needs one redraw at the end
    var source = /** @type {ol.source.Vector} */ (this.getMap().getLayer(os.ui.query.DRAW_ID).getSource());
    source.changed();
  }
};


/**
 * @param {!ol.Feature} area
 * @param {boolean=} opt_suppress
 * @return {boolean} true if changed
 * @protected
 */
os.ui.query.AreaManager.prototype.updateStyle = function(area, opt_suppress) {
  var qm = os.ui.query.QueryManager.getInstance();

  var changed = false;
  var defaultStyle = os.style.area.DEFAULT_STYLE;
  var includeStyle = os.style.area.INCLUSION_STYLE;
  var excludeStyle = os.style.area.EXCLUSION_STYLE;
  var entries = qm.getEntries(null, /** @type {string} */ (area.getId()));

  var expectedStyle = defaultStyle;
  var source = /** @type {ol.source.Vector} */ (this.getMap().getLayer(os.ui.query.DRAW_ID).getSource());

  if (entries && entries.length > 0) {
    var layerSet = os.ui.queryManager.getLayerSet();
    var layers = goog.object.getKeys(layerSet);
    var layer = layers.length == 1 ? layers[0] : null;
    if (layer) {
      for (var i = 0, n = entries.length; i < n; i++) {
        if (entries[i]['layerId'] == layer) {
          expectedStyle = entries[i]['includeArea'] ? includeStyle : excludeStyle;
          break;
        }
      }
    } else {
      expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ? includeStyle : excludeStyle;
    }
  }

  var style = area.getStyle();

  var id = area.getId();
  if (style !== expectedStyle && id) {
    area.setStyle(expectedStyle);

    if (source.getFeatureById(id)) {
      // 3D can take per feature updates
      source.dispatchEvent(new ol.source.Vector.Event(ol.source.VectorEventType.CHANGEFEATURE, area));
      changed = true;
    }
  }

  if (changed && !opt_suppress) {
    // 2D just needs one redraw at the end
    source.changed();
  }

  return changed;
};


/**
 * Dispatch a change event
 * @param {!ol.Feature} area
 */
os.ui.query.AreaManager.prototype.redraw = function(area) {
  var source = /** @type {ol.source.Vector} */ (this.getMap().getLayer(os.ui.query.DRAW_ID).getSource());
  var id = area.getId();
  if (id && source.getFeatureById(id)) {
    source.dispatchEvent(new ol.source.Vector.Event(ol.source.VectorEventType.CHANGEFEATURE, area));
  }
  source.changed();
};


/**
 * @param {string|ol.Feature} idOrFeature
 */
os.ui.query.AreaManager.prototype.unhighlight = function(idOrFeature) {
  var area = this.get(idOrFeature);

  if (area && this.getMap().containsFeature(area)) {
    var entries = os.ui.queryManager.getEntries(undefined, /** @type {string} */ (area.getId()));

    if (!entries.length > 0) {
      area.setStyle(os.style.area.DEFAULT_STYLE);
    } else if (entries[0]['includeArea']) {
      area.setStyle(os.style.area.INCLUSION_STYLE);
    } else {
      area.setStyle(os.style.area.EXCLUSION_STYLE);
    }
  }
};


/**
 * @param {string|ol.Feature} idOrFeature
 */
os.ui.query.AreaManager.prototype.highlight = function(idOrFeature) {
  var area = this.get(idOrFeature);

  if (area && this.getMap().containsFeature(area)) {
    var container = $('#map-container');

    if (area) {
      area.setStyle(os.style.area.HOVER_STYLE);
      container.css('cursor', 'pointer');
    }
  }
};


/**
 * Notify listeners that a state for this feature has changed
 * @param {ol.Feature} feature The feature
 * @param {string} evt The name of the event
 */
os.ui.query.AreaManager.prototype.fireStateChangeEvent = function(feature, evt) {
  if (feature) {
    this.dispatchEvent(new os.events.PropertyChangeEvent(evt, feature.getId()));
  }
};


/**
 * @param {!ol.Feature} area
 * @return {boolean}
 */
os.ui.query.AreaManager.filterTemp = function(area) {
  return /** @type {boolean} */ (!area.get('temp'));
};


/**
 * @param {!ol.Feature} feature The feature to save as an area
 * @param {Array<os.data.ColumnDefinition>=} opt_columns Columns to display in the save area dialog
 */
os.ui.query.AreaManager.save = function(feature, opt_columns) {
  var columns = opt_columns || undefined;
  var scopeOptions = {
    'feature': feature,
    'columns': columns
  };

  var winLabel;
  if (!os.ui.areaManager.get(feature) || feature.get('temp')) {
    winLabel = os.ui.query.SAVE_WIN_LABEL;
  } else {
    winLabel = os.ui.query.EDIT_WIN_LABEL;
  }

  var windowOptions = {
    'label': winLabel,
    'x': 'center',
    'y': 'center',
    'width': 400,
    'height': columns ? 245 : 225,
    'show-close': true,
    'modal': true
  };

  var template = '<editarea></editarea>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @param {!Array<!ol.Feature>} features The feature to merge into a new area
 * @param {string=} opt_ui The directive to use
 */
os.ui.query.AreaManager.merge = function(features, opt_ui) {
  var scopeOptions = {
    'features': features
  };

  var windowOptions = {
    'label': 'Merge Areas',
    'x': 'center',
    'y': 'center',
    'width': 400,
    'height': 'auto',
    'show-close': true,
    'modal': false
  };

  var ui = opt_ui || 'mergeareas';
  var template = '<' + ui + '></' + ui + '>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @type {?os.ui.query.AreaManager}
 */
os.ui.areaManager = null;
