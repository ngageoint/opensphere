goog.module('os.ol.source.VectorTile');

const OLVectorTileSource = goog.require('ol.source.VectorTile');
const {expandUrl, createFromTileUrlFunctions} = goog.require('ol.TileUrlFunction');

const Projection = goog.requireType('ol.proj.Projection');


/**
 * Layer source for vector tile data.
 */
class VectorTile extends OLVectorTileSource {
  /**
   * Constructor.
   * @param {olx.source.VectorTileOptions} options Vector tile options.
   */
  constructor(options) {
    options.projection = options.projection !== undefined ? options.projection : 'EPSG:4326';
    super(options);

    /**
     * @type {number}
     * @protected
     */
    this.zoomOffset = options['zoomOffset'] || 0;

    if (options.urls) {
      this.setUrls(options.urls);
    } else if (options.url) {
      this.setUrl(options.url);
    }
  }

  /**
   * @inheritDoc
   */
  setUrl(url) {
    var urls = this.urls = expandUrl(url);
    this.setTileUrlFunction(this.createFromTemplates(urls));
  }

  /**
   * @inheritDoc
   */
  setUrls(urls) {
    this.urls = urls;
    this.setTileUrlFunction(this.createFromTemplates(urls));
  }

  /**
   * @param {string} template Template
   * @return {ol.TileUrlFunctionType} Tile URL function
   * @protected
   */
  createFromTemplate(template) {
    // handle both  {x}/{y}/{z} and %x/%y/%z formats
    var zRegEx = /\{z\}|\%z/g;
    var xRegEx = /\{x\}|\%x/g;
    var yRegEx = /\{y\}|\%y/g;
    var dashYRegEx = /\{-y\}/g;
    var offset = this.zoomOffset;
    return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (tileCoord === null) {
          return undefined;
        } else {
          return template.replace(zRegEx, (tileCoord[0] + offset).toString())
              .replace(xRegEx, tileCoord[1].toString())
              .replace(yRegEx, (-tileCoord[2] - 1).toString())
              .replace(dashYRegEx, function() {
                var y = (1 << tileCoord[0]) - tileCoord[2] - 1;
                return y.toString();
              });
        }
      }
    );
  }

  /**
   * @param {Array<string>} templates Templates.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   * @protected
   */
  createFromTemplates(templates) {
    return createFromTileUrlFunctions(templates.map(this.createFromTemplate, this));
  }
}

exports = VectorTile;
