goog.declareModuleId('os.layer.config.AbstractTileLayerConfig');

import {transformExtent} from 'ol/src/proj.js';
import {DEFAULT_MAX_ZOOM} from 'ol/src/tilegrid/common.js';
import TileGrid from 'ol/src/tilegrid/TileGrid.js';
import {createForProjection} from 'ol/src/tilegrid.js';

import '../../mixin/tileimagemixin.js';
import '../../mixin/urltilemixin.js';
import Settings from '../../config/settings.js';
import osImplements from '../../implements.js';
import CrossOrigin from '../../net/crossorigin.js';
import {getCrossOrigin, isValidCrossOrigin, registerCrossOrigin} from '../../net/net.js';
import {addProxyWrapper, autoProxyCheck} from '../../ol/source/tileimage.js';
import {EPSG4326, getBestSupportedProjection} from '../../proj/proj.js';
import IFilterableTileSource from '../../source/ifilterabletilesource.js';
import ColorableTile from '../../tile/colorabletile.js';
import Tile from '../tile.js';
import AbstractLayerConfig from './abstractlayerconfig.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: TileClass} = goog.requireType('os.TileClass');


/**
 * @abstract
 */
export default class AbstractTileLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Projection}
     * @protected
     */
    this.projection = null;

    /**
     * @type {?TileGrid}
     * @protected
     */
    this.tileGrid = null;

    /**
     * @type {?CrossOrigin}
     * @protected
     */
    this.crossOrigin = null;

    /**
     * @type {!Function}
     * @protected
     */
    this.layerClass = Tile;

    /**
     * @type {!TileClass}
     * @protected
     */
    this.tileClass = ColorableTile;

    /**
     * List of URLs for load balancing.
     * @type {Array<string>}
     * @protected
     */
    this.urls = [];

    /**
     * Node UI string for the layer being created.
     * @type {?string}
     * @protected
     */
    this.layerNodeUi = null;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    if (options['urls'] != null) {
      this.urls = /** @type {!Array<string>} */ (options['urls']);
    } else if (this.url) {
      // make sure the "urls" property is set in the options for multiple URL support
      options['urls'] = this.urls = [this.url];

      // remove the "url" property to avoid confusion
      options['url'] = undefined;
    }

    this.expandUrls();
    this.urls = this.urls.map(AbstractTileLayerConfig.addBaseServer);

    options['urls'] = this.urls;

    var width = this.getTileWidth(options);
    var height = this.getTileHeight(options);

    if (width === 512 && options['zoomOffset'] == null) {
      options['zoomOffset'] = -1;
    }

    var projection = getBestSupportedProjection(options);
    if (!projection) {
      throw new Error('No projections supported by the layer are defined!');
    }

    this.projection = projection;
    const tempGrid = createForProjection(this.projection, DEFAULT_MAX_ZOOM, [width, height]);
    const gridOptions = {
      extent: tempGrid.getExtent(),
      origin: tempGrid.getOrigin(0),
      resolutions: tempGrid.getResolutions(),
      tileSize: tempGrid.getTileSize(0),
      minZoom: options['zoomOffset'] == -1 ? 1 : 0
    };

    this.tileGrid = new TileGrid(gridOptions);

    // cross origin
    if (!isValidCrossOrigin(options['crossOrigin'])) {
      this.crossOrigin = /** @type {CrossOrigin} */ (getCrossOrigin(this.urls[0]));
    } else {
      this.crossOrigin = /** @type {CrossOrigin} */ (options['crossOrigin']);

      for (var i = 0; i < this.urls.length; i++) {
        var url = this.urls[i];

        // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
        registerCrossOrigin(AbstractTileLayerConfig.getUrlPattern(url), this.crossOrigin);
      }
    }

    // the correct none equivalent for crossOrigin in OL3 is null
    if (this.crossOrigin === CrossOrigin.NONE) {
      this.crossOrigin = null;
      options['crossOrigin'] = null;
    }

    if (options['layerNodeUi']) {
      // pull the nodeUi off the options object to prevent it from being persisted by the layer
      this.layerNodeUi = options['layerNodeUi'];
      delete options['layerNodeUi'];
    }

    // tile class
    this.layerClass = /** @type {Function} */ (options['layerClass']) || this.layerClass;
    this.tileClass = /** @type {TileClass} */ (options['tileClass']) || this.tileClass;
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    var source = this.getSource(options);

    if (this.tileClass && osImplements(source, IFilterableTileSource.ID)) {
      source.setTileClass(this.tileClass);
    }

    // The extent is set on the source and not the layer in order to properly support wrap-x.
    // See urltilemixin.js for more details.
    if (options['extent']) {
      var extentProjection = /** @type {!string} */ (options['extentProjection']) || EPSG4326;
      var extent = /** @type {ol.Extent} */ (options['extent']);
      source.setExtent(transformExtent(extent, extentProjection, this.projection));
    }

    if (options['attributions']) {
      source.setAttributions(/** @type {Array<string>} */ (options['attributions']));
    }

    if (this.crossOrigin && this.crossOrigin !== CrossOrigin.NONE) {
      if (options['proxy']) {
        log.fine(logger,
            'layer ' + this.id + ' proxy=true');
        addProxyWrapper(source);
      } else if (options['proxy'] === undefined) {
        log.fine(logger,
            'layer ' + this.id + ' proxy=auto');
        autoProxyCheck(source, this.projection);
      }
    }

    log.fine(logger,
        'layer ' + this.id + ' crossOrigin=' + this.crossOrigin);

    if (!source.tileLoadSet) {
      source.setTileLoadFunction(source.getTileLoadFunction());
    }

    var tileImageOptions = /** @type {olx.source.TileImageOptions} */ ({
      source: source
    });

    var tileLayer = new this.layerClass(tileImageOptions);
    this.configureLayer(tileLayer, options);
    tileLayer.restore(options);
    return tileLayer;
  }

  /**
   * @param {Tile} layer
   * @param {Object<string, *>} options
   * @protected
   */
  configureLayer(layer, options) {
    if (options['explicitType'] != null) {
      layer.setExplicitType(/** @type {string} */ (options['explicitType']));
    }

    if (this.layerNodeUi) {
      layer.setNodeUI(this.layerNodeUi);
    }
  }

  /**
   * @abstract
   * @param {Object<string, *>} options
   * @return {TileImage}
   * @protected
   */
  getSource(options) {}

  /**
   * @param {Object<string, *>} options
   * @return {number}
   * @protected
   */
  getTileWidth(options) {
    return /** @type {number} */ (options['tileWidth'] || options['tileSize'] || 512);
  }

  /**
   * @param {Object<string, *>} options
   * @return {number}
   * @protected
   */
  getTileHeight(options) {
    return /** @type {number} */ (options['tileHeight'] || options['tileSize'] || 512);
  }

  /**
   * Expand URLs that contain ranges for rotating tile servers.
   *
   * @protected
   */
  expandUrls() {
    this.urls = AbstractTileLayerConfig.expandUrls(this.urls);
  }

  /**
   * @param {string} url The url
   * @return {RegExp} The url pattern
   */
  static getUrlPattern(url) {
    // replace {z}, {x}, {y}, and {-y} with number regexps
    url = url.replace(/{-?[zxy]}/g, '\\d+');

    // replace {0-9} ranges for rotating tile servers
    url = url.replace(AbstractTileLayerConfig.RotatingNumericRegexp, '\\d');

    // replace {a-z} ranges for rotating tile servers
    url = url.replace(AbstractTileLayerConfig.RotatingAlphaRegexp, '[a-zA-Z]');

    return new RegExp('^' + url);
  }

  /**
   * Expand URLs that contain ranges for rotating tile servers.
   * @param {Array<string>} urls The URLs to expand.
   * @return {Array<string>} The expanded URLs.
   */
  static expandUrls(urls) {
    var expandedUrls = [];

    if (urls) {
      for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        if (typeof url === 'string') {
          var expanded = /** @type {Array<string>} */ (AbstractTileLayerConfig.expandUrl(url));
          for (var j = 0; j < expanded.length; j++) {
            var expandedUrl = /** @type {string} */ (expanded[j]);
            expandedUrls.push(expandedUrl);
          }
        } else {
          // pass through.
          expandedUrls.push(url);
        }
      }
    }

    log.fine(logger,
        'Potentially expanded URL set: ' + expandedUrls.join());

    return expandedUrls;
  }

  /**
   * Expand a URL that contains a range for rotating tile servers.
   *
   * URLs that do not contain a range are returned as a single element array.
   *
   * @param {string} url the url to expand
   * @return {Array<string>} the full list of urls corresponding to the url range.
   */
  static expandUrl(url) {
    var urls = [];
    if (AbstractTileLayerConfig.RotatingAlphaRegexp.test(url)) {
      log.fine(logger, 'Expanding URL with alpha range: ' + url);
      var match = url.match(AbstractTileLayerConfig.RotatingAlphaRegexp)[0];
      urls = urls.concat(AbstractTileLayerConfig.expandUrlMatch(url, match));
    } else if (AbstractTileLayerConfig.RotatingNumericRegexp.test(url)) {
      log.fine(logger, 'Expanding URL with numeric range: ' + url);
      var match = url.match(AbstractTileLayerConfig.RotatingNumericRegexp)[0];
      urls = urls.concat(AbstractTileLayerConfig.expandUrlMatch(url, match));
    } else {
      log.fine(logger, 'Not expanding URL: ' + url);
      urls.push(url);
    }
    return urls;
  }

  /**
   * Expand a URL match.
   *
   * URLs that do not contain a range are returned as a single element array.
   *
   * @param {string} url the url to expand
   * @param {string} match the matched values
   * @return {Array<string>} the full list of urls corresponding to the url.
   * @protected
   */
  static expandUrlMatch(url, match) {
    var urls = [];
    var range = match.slice(1, -1);
    var parts = range.split('-');
    var start = parts[0];
    var end = parts[1];
    for (var i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
      var replace = String.fromCharCode(i);
      var expandedUrl = url.replace(match, replace);
      urls.push(expandedUrl);
    }
    return urls;
  }

  /**
   * @param {string} url
   * @return {string}
   */
  static addBaseServer(url) {
    var baseUrl = /** @type {string|undefined} */ (Settings.getInstance().get('baseUrl'));
    return (baseUrl && url && url.startsWith('/') && !url.startsWith('//')) ?
        baseUrl + url : url;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.layer.config.AbstractTileLayerConfig');

/**
 * Regular expression matcher for rotating tile server names in alpha range.
 * @type {RegExp}
 * @const
 */
AbstractTileLayerConfig.RotatingAlphaRegexp = new RegExp(/{[a-zA-Z]-[a-zA-Z]}/g);

/**
 * Regular expression matcher for rotating tile server names in numerical range.
 * @type {RegExp}
 * @const
 */
AbstractTileLayerConfig.RotatingNumericRegexp = new RegExp(/{\d-\d}/g);
