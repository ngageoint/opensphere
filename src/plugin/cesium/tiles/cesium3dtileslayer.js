goog.declareModuleId('plugin.cesium.tiles.Layer');

import {transformExtent} from 'ol/src/proj.js';
import ActionEventType from '../../../os/action/eventtype.js';
import settings from '../../../os/config/settings.js';
import * as dispatcher from '../../../os/dispatcher.js';
import LayerEvent from '../../../os/events/layerevent.js';
import LayerEventType from '../../../os/events/layereventtype.js';
import {PROJECTION} from '../../../os/map/map.js';
import MapEvent from '../../../os/map/mapevent.js';
import {EPSG4326} from '../../../os/proj/proj.js';
import {DEFAULT_LAYER_COLOR} from '../../../os/style/style.js';
import {CESIUM_ONLY_LAYER, SettingsKey, createIonAssetUrl, promptForAccessToken, promptForWorldTerrain, rectangleToExtent} from '../cesium.js';
import PrimitiveLayer from '../primitivelayer.js';
import {directiveTag as layerUITag} from './cesium3dtilelayerui.js';
import {ICON, TYPE} from './cesium3dtiles.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.cesium.tiles.Layer');


/**
 * Cesium 3D tiles layer.
 */
export default class Layer extends PrimitiveLayer {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Cesium Ion asset id.
     * @type {number}
     * @protected
     */
    this.assetId = NaN;

    /**
     * Cesium Ion access token.
     * @type {string}
     * @protected
     */
    this.accessToken = '';

    /**
     * Error message for access token issues
     * @type {string}
     * @private
     */
    this.tokenError_ = '';

    /**
     * @type {Cesium.Resource|Object|string}
     * @protected
     */
    this.tileStyle = null;

    /**
     * @type {string}
     * @protected
     */
    this.url = '';

    /**
     * If Cesium World Terrain should be activated with this layer.
     * @type {boolean}
     * @protected
     */
    this.useWorldTerrain = false;

    this.setOSType(CESIUM_ONLY_LAYER);
    this.setIcons(ICON);
    this.setExplicitType(TYPE);
    this.setLayerUI(layerUITag);
  }

  /**
   * @inheritDoc
   */
  removePrimitive() {
    var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.getPrimitive());

    if (tileset) {
      tileset.loadProgress.removeEventListener(this.onTileProgress, this);
    }

    super.removePrimitive();
  }

  /**
   * @inheritDoc
   */
  synchronize() {
    super.synchronize();

    if (!this.hasError()) {
      var tilesetUrl = '';
      if (!isNaN(this.assetId)) {
        if (!this.accessToken) {
          promptForAccessToken().then((accessToken) => {
            // Access token provided, synchronize again to test it.
            this.accessToken = accessToken;
            this.synchronize();
          }, () => {
            // Remove the layer if the access token prompt was canceled.
            const removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
            dispatcher.getInstance().dispatchEvent(removeEvent);
          });
        } else {
          tilesetUrl = createIonAssetUrl(this.assetId, this.accessToken);

          tilesetUrl.then(() => {
            // Access token is valid, prompt the user to enable Cesium World Terrain if configured.
            this.checkWorldTerrain();
          }, () => {
            // Access token is invalid. Notify the user.
            this.setTokenError_('The provided Cesium Ion access token is invalid.');
          });
        }
      } else {
        tilesetUrl = this.url;
      }

      if (tilesetUrl) {
        var tileset = new Cesium.Cesium3DTileset({
          url: tilesetUrl
        });

        if (this.tileStyle != null) {
          tileset.style = new Cesium.Cesium3DTileStyle(this.tileStyle);
        } else {
          tileset.style = new Cesium.Cesium3DTileStyle({
            'color': {
              'evaluateColor': this.getFeatureColor.bind(this)
            }
          });
        }

        this.setPrimitive(tileset);
        tileset.loadProgress.addEventListener(this.onTileProgress, this);
      }
    }
  }

  /**
   * Prompt the user to enable Cesium World Terrain if configured.
   * @protected
   */
  checkWorldTerrain() {
    if (this.useWorldTerrain) {
      const layerTitle = this.getTitle() || 'The activated layer';
      promptForWorldTerrain(`
        ${layerTitle} is best displayed with Cesium World Terrain. Would you like to activate it now?
      `);
    }
  }

  /**
   * @param {string} errorMsg The message of the error
   * @protected
   */
  setTokenError_(errorMsg) {
    if (this.tokenError_ !== errorMsg) {
      this.tokenError_ = errorMsg;
      this.updateError();
    }
  }

  /**
   * Get the color for a 3D tile feature.
   *
   * @param {Cesium.Cesium3DTileFeature} feature The feature.
   * @param {Cesium.Color} result The object to store the result.
   * @return {Cesium.Color} The color.
   */
  getFeatureColor(feature, result) {
    var cssColor = this.getColor() || DEFAULT_LAYER_COLOR;
    var cesiumColor = Cesium.Color.fromCssColorString(cssColor, result);
    cesiumColor.alpha = this.getOpacity();

    return cesiumColor;
  }

  /**
   * @inheritDoc
   */
  setColor(value) {
    super.setColor(value);

    var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.getPrimitive());
    if (tileset) {
      tileset.makeStyleDirty();
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  setOpacity(value) {
    super.setOpacity(value);

    var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.getPrimitive());
    if (tileset) {
      tileset.makeStyleDirty();
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @param {number} pendingRequests The number of pending requests
   * @param {number} tilesProcessing The number of tiles currently being processed
   * @protected
   */
  onTileProgress(pendingRequests, tilesProcessing) {
    this.setLoading(pendingRequests > 0);
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    if (typeof config['assetId'] == 'number') {
      this.assetId = /** @type {number} */ (config['assetId']);
    }

    if (config['accessToken']) {
      this.accessToken = /** @type {string} */ (config['accessToken']);
    } else {
      this.accessToken = /** @type {string} */ (settings.getInstance().get(SettingsKey.ACCESS_TOKEN, ''));
    }

    if (config['tileStyle']) {
      this.tileStyle = /** @type {Object|string} */ (config['tileStyle']);
    }

    if (config['url']) {
      this.url = /** @type {string} */ (config['url']);
    }

    this.useWorldTerrain = !!config['useWorldTerrain'];
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    var error = super.getErrorMessage();
    if (!error) {
      error = this.tokenError_;
    }

    return error;
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    try {
      var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.primitive);
      if (tileset && tileset.root && tileset.root.contentBoundingVolume) {
        var extent = rectangleToExtent(tileset.root.contentBoundingVolume.rectangle);
        if (extent) {
          return transformExtent(extent, EPSG4326, PROJECTION);
        }
      }
    } catch (e) {
      log.error(logger, e);
    }
    return super.getExtent();
  }

  /**
   * @inheritDoc
   */
  supportsAction(type, opt_actionArgs) {
    switch (type) {
      case ActionEventType.GOTO:
        return this.getExtent() != null;
      default:
        break;
    }
    return super.supportsAction(type, opt_actionArgs);
  }
}
