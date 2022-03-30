goog.declareModuleId('os.ogc.wmts.WMTSLayerParserV100');

import {get} from 'ol/src/proj.js';
import {optionsFromCapabilities} from 'ol/src/source/WMTS.js';

import {getCrossOrigin} from '../../net/net.js';
import AbstractWMTSLayerParser from './abstractwmtslayerparser.js';

import {detectDateTimeFormats, sortFormats} from './wmts.js';


/**
 * WMTS 1.0.0 layer parser.
 */
export default class WMTSLayerParserV100 extends AbstractWMTSLayerParser {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Tile matrix sets.
     * @type {!Object<string, boolean>}
     * @protected
     */
    this.tileMatrixSets = {};
  }

  /**
   * @inheritDoc
   */
  initialize(capabilities) {
    this.parseTileMatrixSets(capabilities);
  }

  /**
   * @inheritDoc
   */
  parseLayer(capabilities, layer, descriptor) {
    if (capabilities && layer && descriptor) {
      const title = /** @type {string} */ (layer['Title']);
      if (title) {
        descriptor.setTitle(title);
      }

      const description = /** @type {string} */ (layer['Abstract']);
      if (description) {
        descriptor.setDescription(description);
      }

      const dateTimeFormats = detectDateTimeFormats(layer['Dimension']);
      if (dateTimeFormats.dateFormat) {
        descriptor.setWmtsDateFormat(dateTimeFormats.dateFormat);
      }
      if (dateTimeFormats.timeFormat) {
        descriptor.setWmtsTimeFormat(dateTimeFormats.timeFormat);
      }

      const bbox = /** @type {ol.Extent} */ (layer['WGS84BoundingBox']);
      if (bbox && bbox.length === 4) {
        descriptor.setBBox(bbox);
      }

      // OpenLayers defaults to the first format so get them sorted in our preferred order
      layer['Format'].sort(sortFormats);

      const id = this.parseLayerId(layer);
      const wmtsOptions = layer['TileMatrixSetLink'].reduce((wmtsOptions, setLink) => {
        if (id && setLink['TileMatrixSet'] in this.tileMatrixSets) {
          const options = optionsFromCapabilities(capabilities, {
            'layer': id,
            'matrixSet': setLink['TileMatrixSet']
          });
          options.crossOrigin = getCrossOrigin(options.urls[0]);
          wmtsOptions.push(options);
        }

        return wmtsOptions;
      }, []);

      if (wmtsOptions.length) {
        descriptor.setWmtsOptions(wmtsOptions);
      }
    }
  }

  /**
   * Parse tile matrix sets.
   * @param {Object} capabilities The WMTS capabilities object.
   * @protected
   */
  parseTileMatrixSets(capabilities) {
    this.tileMatrixSets = {};

    if (capabilities && capabilities['Contents'] && capabilities['Contents']['TileMatrixSet']) {
      const tileMatrixSet = /** @type {!Array} */ (capabilities['Contents']['TileMatrixSet']);

      // add sets in supported projections since OL will throw an exception if it can't find the projection
      tileMatrixSet.forEach((matrixSet) => {
        // openlayers/src/ol/source/wmts.js is the source for these lines
        const code = matrixSet['SupportedCRS'];
        if (code && !!(get(code.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3')) || olProj.get(code))) {
          const identifier = /** @type {string} */ (matrixSet['Identifier']);
          if (identifier) {
            this.tileMatrixSets[identifier] = true;
          }
        }
      });
    }
  }
}
