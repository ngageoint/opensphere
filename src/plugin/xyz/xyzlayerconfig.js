goog.module('plugin.xyz.XYZLayerConfig');
goog.module.declareLegacyNamespace();

const AbstractTileLayerConfig = goog.require('os.layer.config.AbstractTileLayerConfig');
const osObject = goog.require('os.object');
const XYZ = goog.require('os.ol.source.XYZ');


/**
 * Creates an XYZ layer. XYZ layers are most commonly used as map layers since the tiles
 * are very static and can be easily cached.
 *
 * @example <caption>Example Arc XYZ map layer</caption>
 * "example": {
 *   "type": "BaseMap",
 *   "baseType": "XYZ",
 *
 *   // This must contain {z}, {y} or {-y} (for differing grids), and {x}
 *   "url": "http://example.com/arcgis/rest/services/SomeFolder/ExampleLayer/MapServer/tile/{z}/{y}/{x}",
 *   "tileSize": 512,
 *
 *   // an offset that is added to {z} to line up our zoom levels with the remote service
 *   "zoomOffset": -1,
 *
 *   // the projection
 *   "projection": "EPSG:4326",
 *
 *   // The rest of these are common to other layer configs
 *   "crossOrigin": "none|anonymous|use-credentials", // or omit it altogether
 *   "minZoom": 3,
 *   "maxZoom": 24,
 *   "title": "Example",
 *   "description": "This is an example of an Arc XYZ layer"
 * }
 */
class XYZLayerConfig extends AbstractTileLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    // assume a tile size, it will always be 512 in opensphere but is not supplied by 2D or 3D
    if (options && !options['tileSize']) {
      options['tileSize'] = 512;
    }

    options = /** @type {Object<string, *>} */ (osObject.unsafeClone(options));

    options['projection'] = this.projection;
    options['tileGrid'] = this.tileGrid;
    options['crossOrigin'] = this.crossOrigin;
    options['wrapX'] = this.projection.isGlobal();

    return new XYZ(/** @type {olx.source.XYZOptions} */ (options));
  }
}

exports = XYZLayerConfig;
