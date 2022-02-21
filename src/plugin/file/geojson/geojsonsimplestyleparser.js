goog.declareModuleId('plugin.file.geojson.GeoJSONSimpleStyleParser');

import * as osColor from '../../../os/color.js';
import {mergeConfig, setFeatureStyle} from '../../../os/style/style.js';
import StyleManager from '../../../os/style/stylemanager_shim.js';
import StyleType from '../../../os/style/styletype.js';
import * as maki from '../../../os/ui/file/maki/maki.js';
import GeoJSONParser from './geojsonparser.js';

const log = goog.require('goog.log');



/**
 * A GeoJSON parser that supports the custom extensions to the GeoJSON format described in
 * https://github.com/mapbox/simplestyle-spec
 *
 * @extends {GeoJSONParser<Feature>}
 */
export default class GeoJSONSimpleStyleParser extends GeoJSONParser {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var features = super.parseNext();
    features.forEach(this.process, this);
    return features;
  }

  /**
   * @inheritDoc
   */
  process(feature) {
    super.process(feature);

    try {
      // Extract all simplestyle-spec values.
      // These are not used to style.
      // var title = feature.get('title') || '';
      // var description = feature.get('description') || '';
      var markersize = feature.get('marker-size');
      // An icon id from the Maki project http://mapbox.com/maki/
      var markersymbol = feature.get('marker-symbol');
      // colors can be short #ace or long #aaccee
      var markercolor = /** @type {string} */ (feature.get('marker-color'));
      var stroke = /** @type {string} */ (feature.get('stroke'));
      var strokeopacity = /** @type {number} */ (feature.get('stroke-opacity'));
      var strokewidth = /** @type {number} */ (feature.get('stroke-width'));
      var fill = /** @type {string} */ (feature.get('fill'));
      var fillopacity = /** @type {number} */ (feature.get('fill-opacity'));

      // If there are no simplestyle settings, then this must not be a simple style! Return.
      if (!(markersize || markersymbol || markercolor ||
          stroke || strokeopacity || strokewidth ||
          fill || fillopacity)) {
        return;
      }

      var config = {};

      // Convert to RGBA
      var strokeRGBA = osColor.toRgbArray(stroke);
      var fillRGBA = osColor.toRgbArray(fill);
      var markerRGBA = osColor.toRgbArray(markercolor);

      var fillColor;
      if (fillRGBA) {
        fillColor = 'rgba(' + fillRGBA[0] + ',' + fillRGBA[1] + ',' + fillRGBA[2] + ',' + fillopacity + ')';
      }

      var strokeColor;
      if (strokeRGBA) {
        strokeColor = 'rgba(' + strokeRGBA[0] + ',' + strokeRGBA[1] + ',' + strokeRGBA[2] + ',' + strokeopacity + ')';
      }

      // The current polygons do not support using both fill and stroke attributes for color.
      var foundFill = false;

      // Prefer to use the fill color before the stroke color.
      if (fillRGBA && 85 != fillRGBA[0] || 85 != fillRGBA[1] || 85 != fillRGBA[2]) {
        config['fill'] = {
          'color': fillColor
        };
        foundFill = true;
      }

      // Always safe to set the stroke width.
      config['stroke'] = {
        'width': strokewidth
      };

      // Set the stroke color if you have not set a fill color.
      if (!foundFill) {
        config['stroke'] = {
          'color': strokeColor
        };
      }

      // A marker was defined, so set an icon.
      if (markersymbol && markerRGBA) {
        var png = markersymbol + '-24.png';

        // Marker symbols can be the integers 1 - 9
        // The character a - z
        // Or an icon id from the maki set.
        if (typeof markersymbol === 'number' || markersymbol.match(/^[a-z0-9]$/)) {
          png = 'marker-24.png';
        }

        var scale = .8;
        if ('medium' === markersize) {
          scale = .8;
        } else if ('small' === markersize) {
          scale = .6;
        } else if ('large' === markersize) {
          scale = 1;
        }

        config['image'] = {
          'color': 'rgba(' + markerRGBA[0] + ',' + markerRGBA[1] + ',' + markerRGBA[2] + ',1)',
          'type': 'icon',
          'anchor': [0.5, 0.5],
          'scale': scale,
          'src': maki.ICON_PATH + png
        };
        config['zIndex'] = 151;
      } else {
        config['image'] = {
          'color': strokeColor,
          'stroke': {
            'color': strokeColor,
            'width': strokewidth
          },
          'fill': {
            'color': fillColor
          }
        };
      }

      if (this.sourceId) {
        // merge in the layer config to set anything that wasn't provided by the simplestyle spec
        var layerConfig = StyleManager.getInstance().getLayerConfig(this.sourceId);
        mergeConfig(layerConfig, config);
      }

      feature.set(StyleType.FEATURE, config);
      setFeatureStyle(feature);
    } catch (e) {
      log.error(logger, 'Failed to style the feature!', e);
    }
  }
}


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.geojson.GeoJSONSimpleStyleParser');
