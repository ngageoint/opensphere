goog.module('plugin.vectortile.VectorTileLayerConfig');

goog.require('os.mixin.vectortilesource');

const log = goog.require('goog.log');
const {DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM} = goog.require('ol');
const MVT = goog.require('ol.format.MVT');
const VectorTileRenderType = goog.require('ol.layer.VectorTileRenderType');
const obj = goog.require('ol.obj');
const {transformExtent} = goog.require('ol.proj');
const VectorTileLayer = goog.require('os.layer.VectorTile');
const VectorTileSource = goog.require('os.ol.source.VectorTile');
const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');
const AbstractTileLayerConfig = goog.require('os.layer.config.AbstractTileLayerConfig');
const net = goog.require('os.net');
const CrossOrigin = goog.require('os.net.CrossOrigin');
const Request = goog.require('os.net.Request');
const {addProxyWrapper, autoProxyCheck} = goog.require('os.ol.source.tileimage');
const {getBestSupportedProjection, EPSG4326} = goog.require('os.proj');
const StyleManager = goog.require('os.style.StyleManager');

const Projection = goog.requireType('ol.proj.Projection');
const OLVectorTileSource = goog.requireType('ol.source.VectorTile');


/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.vectortile.VectorTileLayerConfig');


/**
 */
class VectorTileLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?CrossOrigin}
     * @protected
     */
    this.crossOrigin = null;

    /**
     * @type {Projection}
     * @protected
     */
    this.projection = null;

    /**
     * List of URLs for load balancing.
     * @type {Array<string>}
     * @protected
     */
    this.urls = [];
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
    options['urls'] = this.urls;

    const projection = getBestSupportedProjection(options);
    if (!projection) {
      throw new Error('No projections supported by the layer are defined!');
    }

    this.projection = projection;

    // cross origin
    if (!net.isValidCrossOrigin(options['crossOrigin'])) {
      this.crossOrigin = /** @type {CrossOrigin} */ (net.getCrossOrigin(this.urls[0]));
    } else {
      this.crossOrigin = /** @type {CrossOrigin} */ (options['crossOrigin']);

      for (let i = 0; i < this.urls.length; i++) {
        const url = this.urls[i];

        // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
        net.registerCrossOrigin(AbstractTileLayerConfig.getUrlPattern(url), this.crossOrigin);
      }
    }

    // the correct none equivalent for crossOrigin in OL is null
    if (this.crossOrigin === CrossOrigin.NONE) {
      this.crossOrigin = null;
      options['crossOrigin'] = null;
    }

    // Default render mode to 'image'
    if (!options['renderMode']) {
      options['renderMode'] = VectorTileRenderType.IMAGE;
    }

    // If zoom levels aren't specified, assume vector tiles can be generated at all levels
    if (options['minZoom'] == null) {
      options['minZoom'] = DEFAULT_MIN_ZOOM;
    }

    if (options['maxZoom'] == null) {
      options['maxZoom'] = DEFAULT_MAX_ZOOM;
    }
  }

  /**
   * @param {Object<string, *>} options The options
   * @return {VectorTileSource}
   */
  getSource(options) {
    options['format'] = options['format'] !== undefined ? options['format'] : new MVT();
    return new VectorTileSource(options);
  }

  /**
   * @param {OLVectorTileSource} source The source
   * @param {Object<string, *>} options The options
   * @return {VectorTileLayer}
   */
  getLayer(source, options) {
    const vectorTileOptions = /** @type {olx.source.VectorTileOptions} */ (obj.assign({}, options, {
      'source': source
    }));

    const layerClass = /** @type {!Function} */ (options['layerClass'] || VectorTileLayer);
    return new layerClass(vectorTileOptions);
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    const source = this.getSource(options);

    // The extent is set on the source and not the layer in order to properly support wrap-x.
    // See urltilemixin.js for more details.
    if (options['extent']) {
      const extentProjection = /** @type {!string} */ (options['extentProjection']) || EPSG4326;
      const extent = /** @type {ol.Extent} */ (options['extent']);
      source.setExtent(transformExtent(extent, extentProjection, this.projection));
    }

    if (options['attributions']) {
      source.setAttributions(/** @type {Array<string>} */ (options['attributions']));
    }

    if (this.crossOrigin && this.crossOrigin !== CrossOrigin.NONE) {
      if (options['proxy']) {
        log.fine(logger, `layer ${this.id} proxy=true`);
        addProxyWrapper(source);
      } else if (options['proxy'] === undefined) {
        log.fine(logger, `layer ${this.id} proxy=auto`);
        autoProxyCheck(source, this.projection);
      }
    }

    log.fine(logger, `layer ${this.id} crossOrigin=${this.crossOrigin}`);

    if (!source.tileLoadSet) {
      source.setTileLoadFunction(source.getTileLoadFunction());
    }

    const layer = this.getLayer(source, options);
    layer.restore(options);

    if (options['styleUrl'] && options['sources']) {
      new Request(/** @type {string} */ (options['styleUrl'])).getPromise()
          .then((resp) => {
            return JSON.parse(resp);
          })
          .then((glStyle) => {
            const glStyleFunction = parseMapboxStyle(glStyle, /** @type {string|Array<string>} */ (options['sources']));

            /**
             * @param {ol.Feature|ol.render.Feature} feature
             * @param {number} resolution
             * @return {ol.style.Style|Array<ol.style.Style>}
             */
            const styleFunction = (feature, resolution) => {
              let styleConfig = glStyleFunction(feature.getProperties(), feature.getGeometry().getType(), resolution);
              if (styleConfig) {
                if (Array.isArray(styleConfig)) {
                  if (styleConfig.length === 1) {
                    styleConfig = styleConfig[0];
                  } else {
                    styleConfig = obj.assign.apply(null, styleConfig);
                  }
                }

                return StyleManager.getInstance().getOrCreateStyle(styleConfig);
              }

              return null;
            };

            layer.setStyle(styleFunction);
          })
          .thenCatch((e) => {
            log.error(logger, `layer ${layer.getId()} could not load style from ${options['styleUrl']}`);
          });
    }

    return layer;
  }

  /**
   * Expand URLs that contain ranges for rotating tile servers.
   * @protected
   */
  expandUrls() {
    this.urls = AbstractTileLayerConfig.expandUrls(this.urls);
  }
}


exports = VectorTileLayerConfig;
