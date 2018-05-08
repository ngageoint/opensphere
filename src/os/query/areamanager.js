goog.provide('os.query.AreaManager');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('os.command.TransformAreas');
goog.require('os.config.Settings');
goog.require('os.data.CollectionManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.map');
goog.require('os.query');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.window');



/**
 * Manages spatial areas
 * @extends {os.ui.query.AreaManager}
 * @constructor
 */
os.query.AreaManager = function() {
  os.query.AreaManager.base(this, 'constructor');

  /**
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.highlightFeature = undefined;

  os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.color =
      os.settings.get(os.query.AreaManager.KEYS.IN_COLOR,
          os.query.AreaManager.DEFAULT.IN_COLOR);
  os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.width =
      parseInt(os.settings.get(os.query.AreaManager.KEYS.IN_WIDTH,
          os.query.AreaManager.DEFAULT.IN_WIDTH), 10);
  os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.color =
      os.settings.get(os.query.AreaManager.KEYS.EX_COLOR,
          os.query.AreaManager.DEFAULT.EX_COLOR);
  os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.width =
      parseInt(os.settings.get(os.query.AreaManager.KEYS.EX_WIDTH,
          os.query.AreaManager.DEFAULT.EX_WIDTH), 10);

  os.settings.listen(os.query.AreaManager.KEYS.IN_COLOR, this.updateInColor_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.IN_WIDTH, this.updateInWidth_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.EX_COLOR, this.updateExColor_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.EX_WIDTH, this.updateExWidth_, false, this);

  // when switching projections, we want to transform the areas we're keeping
  os.proj.switch.SwitchProjection.getInstance().listen(
      os.proj.switch.CommandListEvent.TYPE, this.onSwitchProjection, false, this);
};
goog.inherits(os.query.AreaManager, os.ui.query.AreaManager);
goog.addSingletonGetter(os.query.AreaManager);

// replace the os.ui AreaManager's getInstance with this one so we never instantiate a second instance
goog.object.extend(os.ui.query.AreaManager, {
  getInstance: function() {
    return os.query.AreaManager.getInstance();
  }
});


/**
 * The base key used by all display settings.
 * @type {string}
 * @const
 */
os.query.AreaManager.BASE_KEY = 'os.area.';


/**
 * Area settings keys.
 * @enum {string}
 */
os.query.AreaManager.KEYS = {
  IN_COLOR: os.query.AreaManager.BASE_KEY + 'inColor',
  IN_WIDTH: os.query.AreaManager.BASE_KEY + 'inWidth',
  EX_COLOR: os.query.AreaManager.BASE_KEY + 'exColor',
  EX_WIDTH: os.query.AreaManager.BASE_KEY + 'exWidth'
};


/**
 * Area settings keys.
 * @enum {string}
 */
os.query.AreaManager.DEFAULT = {
  IN_COLOR: 'rgba(255,255,0,1)',
  IN_WIDTH: '2',
  EX_COLOR: 'rgba(255,0,0,1)',
  EX_WIDTH: '2'
};


/**
 * @type {Object}
 * @const
 */
os.query.AreaManager.DEFAULT_AREA_STYLE = {
  'stroke': {
    'color': 'rgba(136,136,136,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @type {Object}
 * @const
 */
os.query.AreaManager.FULL_INCLUSION_STYLE = {
  'stroke': {
    'color': 'rgba(255,255,0,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @type {Object}
 * @const
 */
os.query.AreaManager.FULL_EXCLUSION_STYLE = {
  'stroke': {
    'color': 'rgba(255,0,0,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @type {Object}
 * @const
 */
os.query.AreaManager.HIGHLIGHT_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'color': 'rgba(0,255,255,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.getMap = function() {
  return os.MapContainer.getInstance();
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.load = function() {
  return this.getStoredAreas().addCallback(function(areas) {
    if (areas) {
      this.bulkAdd(areas, false);
    }
  }, this);
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.save = function() {
  var format = new ol.format.GeoJSON();
  var areas = this.getAll().filter(os.ui.query.AreaManager.filterTemp).map(os.query.AreaManager.mapOriginalGeoms);
  var obj = format.writeFeaturesObject(areas, {
    featureProjection: os.map.PROJECTION
  });

  os.settings.set(os.AREA_STORAGE_KEY, obj);
  return goog.async.Deferred.succeed();
};


/**
 * @param {!ol.Feature} area The area
 * @return {!ol.Feature} The area with the original geometry, if any
 */
os.query.AreaManager.mapOriginalGeoms = function(area) {
  var orig = /** @type {ol.geom.Geometry} */ (area.get(os.interpolate.ORIGINAL_GEOM_FIELD));

  if (orig) {
    area = /** @type {!ol.Feature} */ (area.clone());
    area.setGeometry(orig);
    area.set(os.interpolate.ORIGINAL_GEOM_FIELD, undefined);
  }

  return area;
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.setDefaultStyle = function(feature) {
  feature.set(os.style.StyleType.HIGHLIGHT, undefined, true);
  feature.set(os.style.StyleType.FEATURE, os.query.AreaManager.DEFAULT_AREA_STYLE, true);
  os.style.setFeatureStyle(feature);
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.updateStyle = function(area, opt_suppress) {
  var qm = os.ui.queryManager;

  var changed = false;
  var defaultStyle = undefined;
  var includeStyle = os.query.AreaManager.FULL_INCLUSION_STYLE;
  var excludeStyle = os.query.AreaManager.FULL_EXCLUSION_STYLE;
  var entries = qm.getEntries(null, /** @type {string} */ (area.getId()));

  var expectedStyle = defaultStyle;
  var source = /** @type {ol.source.Vector} */ (os.MapContainer.getInstance().getLayer(
      os.MapContainer.DRAW_ID).getSource());

  if (entries && entries.length > 0) {
    // todo: loop over entries and determine if area is a full or partial include
    expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ? includeStyle : excludeStyle;
  }

  var style = area.get(os.style.StyleType.SELECT);

  var id = area.getId();
  if (style !== expectedStyle && id) {
    area.set(os.style.StyleType.SELECT, expectedStyle);
    os.style.setFeatureStyle(area);

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
 * @inheritDoc
 */
os.query.AreaManager.prototype.redraw = function(area) {
  var source = /** @type {ol.source.Vector} */ (os.MapContainer.getInstance().getLayer(
      os.MapContainer.DRAW_ID).getSource());
  var id = area.getId();
  if (id && source.getFeatureById(id)) {
    source.dispatchEvent(new ol.source.Vector.Event(ol.source.VectorEventType.CHANGEFEATURE, area));
  }
  source.changed();
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.unhighlight = function(idOrFeature) {
  if (this.highlightFeature) {
    os.MapContainer.getInstance().removeFeature(this.highlightFeature);
    this.highlightFeature = undefined;
  }
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.highlight = function(idOrFeature) {
  if (this.highlightFeature) {
    os.MapContainer.getInstance().removeFeature(this.highlightFeature);
    this.highlightFeature = undefined;
  }

  var area = this.get(idOrFeature);
  var map = os.MapContainer.getInstance();
  if (area && map.containsFeature(area)) {
    // this is an unfortunate workaround to the Cesium synchronizer not supporting removing/adding fill
    var geometry = area.getGeometry();
    if (geometry) {
      var feature = new ol.Feature(geometry.clone());
      // do not show a drawing layer node for this feature
      feature.set(os.data.RecordField.DRAWING_LAYER_NODE, false);
      this.highlightFeature = map.addFeature(feature, os.query.AreaManager.HIGHLIGHT_STYLE);
    }
  }
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.addInternal = function(feature, opt_bulk) {
  if (feature && !feature.get(os.interpolate.METHOD_FIELD)) {
    var geometry = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) ||
        feature.getGeometry();
    var set = false;

    if (geometry instanceof ol.geom.Polygon) {
      var coords = geometry.getCoordinates();

      if (coords.length == 1 && os.geo.isRectangular(coords[0], geometry.getExtent())) {
        // a single rectangular polygon is a box, which should always be interpolated with rhumb lines
        feature.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.RHUMB, true);
        set = true;
      }
    }

    if (!set) {
      // if it wasn't a rectangle geometry, then instead fall back to the application setting
      feature.set(os.interpolate.METHOD_FIELD, os.interpolate.getMethod(), true);
    }

    if (os.query.isWorldQuery(geometry)) {
      feature.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);
    }
  }

  if (os.query.AreaManager.base(this, 'addInternal', feature, opt_bulk)) {
    feature.enableEvents();
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.query.AreaManager.prototype.normalizeGeometry = function(feature) {
  // TODO: I'd prefer to have the normalizeGeometryCoordinate method take an optional projection
  // rather than converting to/from EPSG:4326
  var geom = feature.getGeometry();

  if (!geom.get(os.geom.GeometryField.NORMALIZED)) {
    geom.toLonLat();
    os.geo.normalizeGeometryCoordinates(geom);
    geom.osTransform();
    feature.setGeometry(geom);
  }
};


/**
 * Converts all color types to a standard rgba string.
 *
 * @param {ol.Color|string} color
 * @return {string}
 */
os.query.AreaManager.prototype.toRgbaString = function(color) {
  return ol.color.asString(goog.isString(color) ? os.color.toRgbArray(color) : color);
};


/**
 * Handle Include Color changes.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.query.AreaManager.prototype.updateInColor_ = function(event) {
  if (event.newVal && this.toRgbaString(/** @type {string} */(event.newVal)) !=
      os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.color) {
    os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.color = this.toRgbaString(/** @type {string} */(event.newVal));
    this.redrawQueryAreas_();
  }
};


/**
 * Handle Include Width changes.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.query.AreaManager.prototype.updateInWidth_ = function(event) {
  if (event.newVal && event.newVal != os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.width) {
    os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.width = parseInt(event.newVal, 10);
    this.redrawQueryAreas_();
  }
};


/**
 * Handle Exclude Color changes.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.query.AreaManager.prototype.updateExColor_ = function(event) {
  if (event.newVal && this.toRgbaString(/** @type {string} */(event.newVal)) !=
      os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.color) {
    os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.color = this.toRgbaString(/** @type {string} */(event.newVal));
    this.redrawQueryAreas_();
  }
};


/**
 * Handle Exclude Width changes.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.query.AreaManager.prototype.updateExWidth_ = function(event) {
  if (event.newVal && event.newVal != os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.width) {
    os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.width = parseInt(event.newVal, 10);
    this.redrawQueryAreas_();
  }
};


/**
 * Converts all color types to a standard rgba string.
 *
 * @private
 */
os.query.AreaManager.prototype.redrawQueryAreas_ = function() {
  var areas = this.getAll();
  goog.array.forEach(areas, function(area) {
    if (goog.isDefAndNotNull(area.getStyle())) {
      var entries = os.ui.query.QueryManager.getInstance().getEntries(null, /** @type {string} */ (area.getId()));
      if (entries && entries.length > 0) {
        var expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ?
            goog.object.unsafeClone(os.query.AreaManager.FULL_INCLUSION_STYLE) :
            goog.object.unsafeClone(os.query.AreaManager.FULL_EXCLUSION_STYLE);
        area.set(os.style.StyleType.SELECT, expectedStyle);
        os.style.setFeatureStyle(area);
        this.redraw(area);
      }
    }
  }, this);
};


/**
 * When SwitchProjection sets up its list of commands, add one to transform our areas.
 *
 * @param {os.proj.switch.CommandListEvent} evt
 * @protected
 */
os.query.AreaManager.prototype.onSwitchProjection = function(evt) {
  var sp = os.proj.switch.SwitchProjection.getInstance();
  var oldProjection = sp.getOldProjection();
  var newProjection = sp.getNewProjection();

  if (oldProjection && newProjection) {
    evt.commands.push(new os.command.TransformAreas(oldProjection, newProjection));
  }
};
