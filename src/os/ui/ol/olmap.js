goog.provide('os.ui.ol.OLMap');

goog.require('goog.events.EventTarget');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.log');
goog.require('goog.math.Coordinate');
goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ZoomSlider');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.DragZoom');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.tilegrid.TileGrid');
goog.require('os.fn');
goog.require('os.map.IMapContainer');
goog.require('os.ol.source.XYZ');
goog.require('os.ui.ol.control.LayerSwitcher');
goog.require('os.ui.ol.interaction.AreaHover');
goog.require('os.ui.ol.interaction.FocusInteraction');
goog.require('os.ui.ol.interaction.MouseWheelZoom');
goog.require('os.ui.query.AreaManager');



/**
 * A basic implementation of an Openlayers map. Attaches itself in the DOM to the passed in selector. Creates a
 * basic vector layer for drawings/shapes. Adds a base set of maps from localStorage layer configs.
 * @implements {os.map.IMapContainer}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.ol.OLMap = function() {
  os.ui.ol.OLMap.base(this, 'constructor');

  /**
   * The Openlayers map.
   * @type {ol.PluggableMap}
   * @private
   */
  this.map_ = null;

  /**
   * @type {ol.layer.Vector}
   * @private
   */
  this.drawingLayer_ = null;

  /**
   * Since this map is in scrollable pages, set a focus flag when the map should be focused
   * @type {boolean}
   * @private
   */
  this.focused_ = false;

  os.dispatcher.listen(os.ui.action.EventType.ZOOM, this.onZoom_, false, this);
};
goog.inherits(os.ui.ol.OLMap, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.ol.OLMap.LOGGER_ = goog.log.getLogger('os.ui.ol.OLMap');


/**
 * Projection used for the map and all of its layers.
 * @type {ol.proj.Projection}
 * @const
 */
os.ui.ol.OLMap.PROJECTION = ol.proj.get('EPSG:4326');


/**
 * Tile grid to request 512x512 tiles.
 * @type {ol.tilegrid.TileGrid}
 * @const
 */
os.ui.ol.OLMap.TILEGRID = ol.tilegrid.createForProjection(
    os.ui.ol.OLMap.PROJECTION, ol.DEFAULT_MAX_ZOOM, [512, 512]);


/**
 * The ID for the drawing layer
 * @type {string}
 * @const
 */
os.ui.ol.OLMap.DRAW_ID = 'draw';


/**
 * The style for the drawing layer
 * @type {ol.style.Style}
 * @const
 */
os.ui.ol.OLMap.DRAW_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#0ff',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#0ff'
    })
  })
});


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.disposeInternal = function() {
  if (this.map_) {
    this.map_.dispose();
    this.map_ = null;
  }

  os.dispatcher.unlisten(os.ui.action.EventType.ZOOM, this.onZoom_, false, this);

  os.ui.ol.OLMap.base(this, 'disposeInternal');
};


/**
 * Initializes the map and layers.
 * @param {(string|Element)=} opt_container The optional container, defaults to map-container.
 */
os.ui.ol.OLMap.prototype.init = function(opt_container) {
  if (this.map_) {
    return;
  }

  opt_container = opt_container || 'map-container';
  this.map_ = new ol.Map({
    controls: this.getControls_(),
    interactions: this.getInteractions_(),
    layers: this.getLayers_(),
    target: opt_container,
    view: new ol.View({
      extent: [-180, -90, 180, 90],
      projection: os.ui.ol.OLMap.PROJECTION,
      center: [0, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 15
    })
  });

  if (goog.userAgent.IE) {
    try {
      var olCanvas = /** @type {HTMLElement} */ ($('.ol-viewport > canvas')[0]);
      olCanvas.style.height = '';
      olCanvas.style.width = '';
    } catch (e) {
    }
  }

  $(this.map_.getViewport()).attr('tabindex', 50);
  os.ui.query.AreaManager.getInstance().setMap(this);

  // If any control element gets clicked. set the map focus
  $('.ol-overlaycontainer-stopevent > div, .ol-overlaycontainer-stopevent > div *').click(goog.bind(function() {
    this.setFocused(true);
  }, this));
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.addFeature = function(feature, opt_style) {
  if (feature) {
    if (opt_style && opt_style instanceof ol.style.Style) {
      feature.setStyle(opt_style);
    }

    var source = this.drawingLayer_.getSource();
    source.addFeature(feature);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.addFeatures = function(features) {
  var added = [];
  for (var i = 0, n = features.length; i < n; i++) {
    if (this.addFeature(features[i])) {
      added.push(features[i]);
    }
  }

  return added;
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.removeFeature = function(feature, opt_dispose) {
  if (feature) {
    var source = this.drawingLayer_.getSource();
    if (goog.isString(feature) || goog.isNumber(feature)) {
      feature = source.getFeatureById(feature);
    } else {
      feature = source.getFeatureById(feature.getId() + '');
    }

    if (feature) {
      source.removeFeature(feature);

      if (opt_dispose) {
        feature.dispose();
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.removeFeatures = function(features, opt_dispose) {
  for (var i = 0, n = features.length; i < n; i++) {
    this.removeFeature(features[i], opt_dispose);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.getMap = function() {
  return this.map_;
};


/**
 * @return {?ol.layer.Vector}
 */
os.ui.ol.OLMap.prototype.getDrawingLayer = function() {
  return this.drawingLayer_;
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.containsFeature = function(feature) {
  if (goog.isDefAndNotNull(feature)) {
    var layer = this.getDrawingLayer();

    if (layer) {
      var source = /** @type {ol.source.Vector} */ (layer.getSource());

      return !!(goog.isString(feature) || goog.isNumber(feature) ? source.getFeatureById(feature) :
          source.getFeatureById(feature.getId() + ''));
    }
  }

  return false;
};


/**
 * Fits the view to an extent.
 * @param {ol.Extent} extent The extent to fit
 * @param {number=} opt_buffer Scale factor for the extent to provide a buffer around the displayed area
 * @param {number=} opt_maxZoom The maximum zoom level for the updated view
 */
os.ui.ol.OLMap.prototype.flyToExtent = function(extent, opt_buffer, opt_maxZoom) {
  var map = this.getMap();
  if (map) {
    var view = map.getView();
    goog.asserts.assert(goog.isDef(view));

    if (extent) {
      if (opt_buffer && opt_buffer > 0) {
        // clone the extent before modifying it to avoid potentially adverse affects
        extent = extent.slice();
        ol.extent.scaleFromCenter(extent, opt_buffer);
      }

      view.fit(extent, {
        constrainResolution: false,
        duration: 1000,
        maxZoom: opt_maxZoom
      });
    }
  }
};


/**
 * @return {ol.Collection}
 * @private
 */
os.ui.ol.OLMap.prototype.getControls_ = function() {
  var controls = ol.control.defaults({
    attribution: false,
    rotate: false
  });
  var mapControls = [];
  var scaleLine = new ol.control.ScaleLine({
    target: document.getElementById('scale-line')
  });
  var zoomSlider = new ol.control.ZoomSlider();
  var layerSwitcher = new os.ui.ol.control.LayerSwitcher();

  mapControls.push(scaleLine);
  mapControls.push(zoomSlider);
  mapControls.push(layerSwitcher);
  controls.extend(mapControls);
  return controls;
};


/**
 * @return {ol.Collection}
 * @private
 */
os.ui.ol.OLMap.prototype.getInteractions_ = function() {
  var ctrlZoom = new ol.interaction.DragZoom({
    condition: ol.events.condition.platformModifierKeyOnly,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [0x33, 0xff, 0xff, 1]
      }),
      fill: new ol.style.Fill({
        color: [0, 0, 0, 0.25]
      })
    })
  });

  var dragPan = new ol.interaction.DragPan({
    kinetic: undefined
  });
  var areaHover = new os.ui.ol.interaction.AreaHover();
  var mwZoom = new os.ui.ol.interaction.MouseWheelZoom();
  var focus = new os.ui.ol.interaction.FocusInteraction();

  // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
  var interactions = ol.interaction.defaults({
    dragPan: false,
    shiftDragZoom: false,
    zoomDelta: 0.2
  });
  interactions.extend([ctrlZoom, dragPan, mwZoom, areaHover, focus]);
  return interactions;
};


/**
 * Gets the map layers.
 * @return {Array<ol.layer.Base>}
 * @private
 */
os.ui.ol.OLMap.prototype.getLayers_ = function() {
  var provider = /** @type {Object<string, *>} */ (os.settings.get(['providers', 'basemap']));
  var baseMapConfigs = /** @type {Object<string, Object<string, *>>} */ (provider['maps']);
  var layers = [];
  var hasDefault = false;

  // Add the layers separately to be able to add to map by default
  for (var key in baseMapConfigs) {
    var layerConfig = baseMapConfigs[key];
    var source;

    if (layerConfig['baseType'] === 'XYZ') {
      source = new os.ol.source.XYZ(/** @type {olx.source.XYZOptions} */ ({
        projection: 'EPSG:4326',
        url: layerConfig['url'],
        tileSize: 512,
        minZoom: layerConfig['minZoom'],
        maxZoom: layerConfig['maxZoom'],
        'zoomOffset': layerConfig['zoomOffset']
      }));
    } else {
      var params = {
        'EXCEPTIONS': 'INIMAGE',
        'LAYERS': layerConfig['name']
      };

      source = new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
        url: layerConfig['url'],
        params: params,
        serverType: 'geoserver',
        tileGrid: os.ui.ol.OLMap.TILEGRID
      }));
    }

    var layer = new ol.layer.Tile({
      source: source
    });

    if (layerConfig['isDefault']) {
      // note that we have a default because if we don't, we need to set the first one visible
      hasDefault = true;
    }

    layer.setVisible(goog.isDef(layerConfig['isDefault']));
    layer.set('title', layerConfig['display']);
    layer.set('type', 'base');
    layers.push(layer);
  }

  if (!hasDefault && layers.length > 0) {
    // no default configured, just set the first one visible
    layers[0].setVisible(true);
  }

  this.drawingLayer_ = new ol.layer.Vector({
    source: new ol.source.Vector()
  });
  this.drawingLayer_.set('id', os.ui.ol.OLMap.DRAW_ID);
  this.drawingLayer_.setStyle(os.ui.ol.OLMap.DRAW_STYLE);
  layers.unshift(this.drawingLayer_);

  return layers.reverse();
};


/**
 * @inheritDoc
 */
os.ui.ol.OLMap.prototype.getLayer = function(layerOrFeature, opt_search, opt_remove) {
  if (!goog.isDefAndNotNull(opt_remove)) {
    opt_remove = false;
  }

  if (!opt_search && this.map_) {
    opt_search = this.map_.getLayers();
  }

  var l = null;

  if (this.map_) {
    for (var i = 0, n = opt_search.getLength(); i < n; i++) {
      var item = opt_search.item(i);

      try {
        if (goog.isString(layerOrFeature)) {
          var lid = /** @type {ol.layer.Layer} */ (item).get('id');
          if (lid == layerOrFeature) {
            l = /** @type {ol.layer.Layer} */ (item);

            if (opt_remove) {
              opt_search.removeAt(i);
            }

            break;
          }
        } else if (layerOrFeature === item) {
          l = /** @type {ol.layer.Layer} */ (item);

          if (opt_remove) {
            opt_search.removeAt(i);
          }

          break;
        } else if (layerOrFeature instanceof ol.Feature) {
          var src = /** @type {ol.layer.Layer} */ (item).getSource();

          if (src instanceof ol.source.Vector &&
              src.getFeatureById(/** @type {ol.Feature} */ (layerOrFeature).getId() || '')) {
            l = /** @type {ol.layer.Layer} */ (item);
          }
        }
      } catch (e) {
        // whatever
      }

      if (l) {
        break;
      }
    }
  }

  return l;
};


/**
 * Set if the map is focused or not
 * @param {boolean} focused
 */
os.ui.ol.OLMap.prototype.setFocused = function(focused) {
  this.focused_ = focused;
};


/**
 * Get if the map is focused or not
 * @return {boolean}
 */
os.ui.ol.OLMap.prototype.getFocused = function() {
  return this.focused_;
};


/**
 * Handle zoom action events. Flies to an extent containing all geometries in the extent.
 * @param {os.ui.action.ActionEvent} event The action event.
 * @private
 */
os.ui.ol.OLMap.prototype.onZoom_ = function(event) {
  try {
    var context = event.getContext();
    if (!goog.isArray(context)) {
      context = [context];
    }

    var extent = /** @type {!Array<?{geometry: ol.geom.Geometry}>} */ (context).reduce(
        os.fn.reduceExtentFromGeometries,
        ol.extent.createEmpty());

    this.flyToExtent(extent, 1.5, os.map.MAX_AUTO_ZOOM);
  } catch (e) {
    goog.log.error(os.ui.ol.OLMap.LOGGER_, 'Zoom action failed:', e);
  }
};
