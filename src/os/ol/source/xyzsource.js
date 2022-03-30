goog.declareModuleId('os.ol.source.XYZ');

import OLXYZ from 'ol/src/source/XYZ.js';
import {expandUrl, createFromTileUrlFunctions} from 'ol/src/tileurlfunction.js';

/**
 * Layer source for tile data with URLs in a set XYZ format.
 */
export default class XYZ extends OLXYZ {
  /**
   * Constructor.
   * @param {olx.source.XYZOptions} options XYZ options.
   */
  constructor(options) {
    options.projection = options.projection !== undefined ? options.projection : 'EPSG:4326';

    super(options);

    /**
     * @type {number}
     * @protected
     */
    this.zoomOffset = options['zoomOffset'] || 0;

    // Set these again because createFromTemplates uses the zoom offset.
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
    var offset = this.zoomOffset || 0;
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
              .replace(yRegEx, tileCoord[2].toString())
              .replace(dashYRegEx, function() {
                var y = (1 << tileCoord[0]) - tileCoord[2] - 1;
                return y.toString();
              });
        }
      }
    );
  }

  /**
   * @param {Array.<string>} templates Templates.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   * @protected
   */
  createFromTemplates(templates) {
    return createFromTileUrlFunctions(templates.map(this.createFromTemplate, this));
  }
}
