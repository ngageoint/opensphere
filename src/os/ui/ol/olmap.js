goog.declareModuleId('os.ui.ol.OLMap');

import {defaults as controlDefaults} from 'ol/src/control.js';
import {platformModifierKeyOnly} from 'ol/src/events/condition.js';
import {createEmpty, scaleFromCenter} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import DragPan from 'ol/src/interaction/DragPan.js';
import DragZoom from 'ol/src/interaction/DragZoom.js';
import {defaults as interactionDefaults} from 'ol/src/interaction.js';
import Tile from 'ol/src/layer/Tile.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import olMap from 'ol/src/Map.js';
import {equivalent, get} from 'ol/src/proj.js';
import TileWMS from 'ol/src/source/TileWMS.js';
import OLVectorSource from 'ol/src/source/Vector.js';
import Circle from 'ol/src/style/Circle.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';
import {DEFAULT_MAX_ZOOM} from 'ol/src/tilegrid/common.js';
import {createForProjection} from 'ol/src/tilegrid.js';
import {getUid} from 'ol/src/util.js';
import View from 'ol/src/View.js';

import Settings from '../../config/settings.js';
import {ProviderKey} from '../../data/data.js';
import * as dispatcher from '../../dispatcher.js';
import {reduceExtentFromGeometries} from '../../fn/fn.js';
import * as osMap from '../../map/map.js';
import {unsafeClone} from '../../object/object.js';
import XYZ from '../../ol/source/xyzsource.js';
import BaseAreaManager from '../../query/baseareamanager.js';
import {setFeatureStyle} from '../../style/style.js';
import StyleType from '../../style/styletype.js';
import EventType from '../action/actioneventtype.js';
import LayerSwitcher from './control/layerswitcher.js';
import AreaHover from './interaction/areahoverinteraction.js';
import FocusInteraction from './interaction/focusinteraction.js';
import MouseWheelZoom from './interaction/mousewheelzoominteraction.js';

const {assert} = goog.require('goog.asserts');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const userAgent = goog.require('goog.userAgent');

const {default: IMapContainer} = goog.requireType('os.map.IMapContainer');
const {default: ActionEvent} = goog.requireType('os.ui.action.ActionEvent');


/**
 * A basic implementation of an Openlayers map. Attaches itself in the DOM to the passed in selector. Creates a
 * basic vector layer for drawings/shapes. Adds a base set of maps from localStorage layer configs.
 *
 * @implements {IMapContainer}
 */
export default class OLMap extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The Openlayers map.
     * @type {PluggableMap}
     * @private
     */
    this.map_ = null;

    /**
     * @type {OLVectorLayer}
     * @private
     */
    this.drawingLayer_ = null;

    /**
     * Since this map is in scrollable pages, set a focus flag when the map should be focused
     * @type {boolean}
     * @private
     */
    this.focused_ = false;

    dispatcher.getInstance().listen(EventType.ZOOM, this.onZoom_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.map_) {
      this.map_.dispose();
      this.map_ = null;
    }

    dispatcher.getInstance().unlisten(EventType.ZOOM, this.onZoom_, false, this);

    super.disposeInternal();
  }

  /**
   * Initializes the map and layers.
   *
   * @param {(string|Element)=} opt_container The optional container, defaults to map-container.
   */
  init(opt_container) {
    if (this.map_) {
      return;
    }

    opt_container = opt_container || 'map-container';
    this.map_ = new olMap({
      controls: this.getControls_(),
      interactions: this.getInteractions_(),
      layers: this.getLayers_(),
      target: opt_container,
      view: new View({
        extent: [-180, -90, 180, 90],
        projection: OLMap.PROJECTION,
        center: [0, 0],
        zoom: 2,
        minZoom: osMap.MIN_ZOOM,
        maxZoom: 15,
        showFullExtent: true,
        constrainRotation: false
      })
    });

    if (userAgent.IE) {
      try {
        var olCanvas = /** @type {HTMLElement} */ ($(osMap.OPENLAYERS_CANVAS)[0]);
        olCanvas.style.height = '';
        olCanvas.style.width = '';
      } catch (e) {
      }
    }

    $(this.map_.getViewport()).attr('tabindex', 50);
    BaseAreaManager.getInstance().setMap(this);

    // If any control element gets clicked. set the map focus
    $('.ol-overlaycontainer-stopevent > div, .ol-overlaycontainer-stopevent > div *').click(function() {
      this.setFocused(true);
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  addFeature(feature, opt_style) {
    if (feature) {
      if (typeof opt_style === 'object') {
        // if created externally, clone the style config
        var style = opt_style instanceof Object ? opt_style : unsafeClone(opt_style);
        feature.set(StyleType.FEATURE, style);
        setFeatureStyle(feature);
      } else if (opt_style && opt_style instanceof Style) {
        feature.setStyle(opt_style);
      }

      if (!feature.getId()) {
        feature.setId(getUid(feature));
      }

      var source = this.drawingLayer_.getSource();
      source.addFeature(feature);
      return feature;
    }
    return undefined;
  }

  /**
   * @inheritDoc
   */
  addFeatures(features) {
    var added = [];
    for (var i = 0, n = features.length; i < n; i++) {
      if (this.addFeature(features[i])) {
        added.push(features[i]);
      }
    }

    return added;
  }

  /**
   * @inheritDoc
   */
  removeFeature(feature, opt_dispose) {
    if (feature) {
      var source = this.drawingLayer_.getSource();
      if (typeof feature === 'string' || typeof feature === 'number') {
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
  }

  /**
   * @inheritDoc
   */
  removeFeatures(features, opt_dispose) {
    for (var i = 0, n = features.length; i < n; i++) {
      this.removeFeature(features[i], opt_dispose);
    }
  }

  /**
   * @inheritDoc
   */
  getMap() {
    return this.map_;
  }

  /**
   * @return {?OLVectorLayer}
   */
  getDrawingLayer() {
    return this.drawingLayer_;
  }

  /**
   * @inheritDoc
   */
  containsFeature(feature) {
    if (feature != null) {
      var layer = this.getDrawingLayer();

      if (layer) {
        var source = /** @type {OLVectorSource} */ (layer.getSource());

        return !!(typeof feature === 'string' || typeof feature === 'number' ? source.getFeatureById(feature) :
          source.getFeatureById(feature.getId() + ''));
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  flyToExtent(extent, opt_buffer, opt_maxZoom) {
    var map = this.getMap();
    if (map) {
      var view = map.getView();
      assert(view !== undefined);

      if (extent) {
        if (opt_buffer && opt_buffer > 0) {
          // clone the extent before modifying it to avoid potentially adverse affects
          extent = extent.slice();
          scaleFromCenter(extent, opt_buffer);
        }

        view.fit(extent, {
          constrainResolution: false,
          duration: 1000,
          maxZoom: opt_maxZoom
        });
      }
    }
  }

  /**
   * @return {Collection}
   * @private
   */
  getControls_() {
    var controls = controlDefaults({
      attribution: false,
      rotate: false
    });
    var mapControls = [];
    var layerSwitcher = new LayerSwitcher();
    mapControls.push(layerSwitcher);
    controls.extend(mapControls);
    return controls;
  }

  /**
   * @return {Collection}
   * @private
   */
  getInteractions_() {
    var ctrlZoom = new DragZoom({
      condition: platformModifierKeyOnly,
      style: new Style({
        stroke: new Stroke({
          color: [0x33, 0xff, 0xff, 1]
        }),
        fill: new Fill({
          color: [0, 0, 0, 0.25]
        })
      })
    });

    var dragPan = new DragPan({
      kinetic: undefined
    });
    var areaHover = new AreaHover();

    // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
    var options = {
      maxDelta: 0.2
    };
    var mwZoom = new MouseWheelZoom(options);
    var focus = new FocusInteraction();

    // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
    var interactions = interactionDefaults({
      dragPan: false,
      shiftDragZoom: false,
      mouseWheelZoom: false,
      zoomDelta: 0.2
    });
    interactions.extend([ctrlZoom, dragPan, mwZoom, areaHover, focus]);
    return interactions;
  }

  /**
   * Gets the map layers.
   *
   * @return {Array<LayerBase>}
   * @private
   */
  getLayers_() {
    var provider = /** @type {Object<string, *>} */ (Settings.getInstance().get([ProviderKey.ADMIN, 'basemap']));
    var baseMapConfigs = /** @type {Object<string, Object<string, *>>} */ (provider['maps']);
    var layers = [];
    var hasDefault = false;

    // Add the layers separately to be able to add to map by default
    for (var key in baseMapConfigs) {
      var layerConfig = baseMapConfigs[key];
      var source;
      var proj = get(/** @type {string|undefined} */ (layerConfig['projection']) || OLMap.PROJECTION);
      if (equivalent(proj, OLMap.PROJECTION)) {
        if (layerConfig['baseType'] === 'XYZ') {
          source = new XYZ(/** @type {olx.source.XYZOptions} */ ({
            projection: proj,
            url: layerConfig['url'],
            tileSize: layerConfig['tileSize'] || 512,
            minZoom: layerConfig['minZoom'],
            maxZoom: layerConfig['maxZoom'],
            'zoomOffset': layerConfig['zoomOffset']
          }));
        } else {
          var params = {
            'EXCEPTIONS': 'INIMAGE',
            'LAYERS': layerConfig['name']
          };

          source = new TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
            url: layerConfig['url'],
            params: params,
            serverType: 'geoserver',
            tileGrid: OLMap.TILEGRID
          }));
        }

        var layer = new Tile({
          source: source
        });

        if (layerConfig['isDefault']) {
          // note that we have a default because if we don't, we need to set the first one visible
          hasDefault = true;
        }

        layer.setVisible(layerConfig['isDefault'] !== undefined);
        layer.set('title', layerConfig['title'] || layerConfig['display']);
        layer.set('type', 'base');
        layers.push(layer);
      }
    }

    if (!hasDefault && layers.length > 0) {
      // no default configured, just set the first one visible
      layers[0].setVisible(true);
    }

    this.drawingLayer_ = new OLVectorLayer({
      source: new OLVectorSource()
    });
    this.drawingLayer_.set('id', OLMap.DRAW_ID);
    this.drawingLayer_.setStyle(OLMap.DRAW_STYLE);
    layers.unshift(this.drawingLayer_);

    return layers.reverse();
  }

  /**
   * @inheritDoc
   */
  getLayer(layerOrFeature, opt_search, opt_remove) {
    if (opt_remove == null) {
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
          if (typeof layerOrFeature === 'string') {
            var lid = /** @type {Layer} */ (item).get('id');
            if (lid == layerOrFeature) {
              l = /** @type {Layer} */ (item);

              if (opt_remove) {
                opt_search.removeAt(i);
              }

              break;
            }
          } else if (layerOrFeature === item) {
            l = /** @type {Layer} */ (item);

            if (opt_remove) {
              opt_search.removeAt(i);
            }

            break;
          } else if (layerOrFeature instanceof Feature) {
            var src = /** @type {Layer} */ (item).getSource();

            if (src instanceof OLVectorSource &&
                src.getFeatureById(/** @type {Feature} */ (layerOrFeature).getId() || '')) {
              l = /** @type {Layer} */ (item);
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
  }

  /**
   * Set if the map is focused or not
   *
   * @param {boolean} focused
   */
  setFocused(focused) {
    this.focused_ = focused;
  }

  /**
   * Get if the map is focused or not
   *
   * @return {boolean}
   */
  getFocused() {
    return this.focused_;
  }

  /**
   * Handle zoom action events. Flies to an extent containing all geometries in the extent.
   *
   * @param {ActionEvent} event The action event.
   * @private
   */
  onZoom_(event) {
    try {
      var context = event.getContext();
      if (!Array.isArray(context)) {
        context = [context];
      }

      var extent = /** @type {!Array<?{geometry: Geometry}>} */ (context).reduce(
          reduceExtentFromGeometries,
          createEmpty());

      this.flyToExtent(extent, 1.5, osMap.MAX_AUTO_ZOOM);
    } catch (e) {
      log.error(logger, 'Zoom action failed:', e);
    }
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.ol.OLMap');

/**
 * Projection used for the map and all of its layers.
 * @type {Projection}
 * @const
 */
OLMap.PROJECTION = get('EPSG:4326');

/**
 * Tile grid to request 512x512 tiles.
 * @type {TileGrid}
 * @const
 */
OLMap.TILEGRID = createForProjection(OLMap.PROJECTION, DEFAULT_MAX_ZOOM, [512, 512]);

/**
 * The ID for the drawing layer
 * @type {string}
 * @const
 */
OLMap.DRAW_ID = 'draw';

/**
 * The style for the drawing layer
 * @type {Style}
 * @const
 */
OLMap.DRAW_STYLE = new Style({
  stroke: new Stroke({
    color: '#0ff',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#0ff'
    })
  })
});
