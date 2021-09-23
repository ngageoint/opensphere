goog.declareModuleId('plugin.cesium.sync.DynamicLineStringConverter');

import BaseConverter from './baseconverter.js';
import {createPolyline, updatePolyline} from './dynamiclinestring.js';

const LineString = goog.requireType('ol.geom.LineString');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Ellipse = goog.requireType('os.geom.Ellipse');


/**
 * Converter for DynamicFeature lines
 * @extends {BaseConverter<(LineString|Ellipse|MultiLineString), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
export default class DynamicLineStringConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const polylineOptions = createPolyline(feature, geometry, style, context);
    context.addPolyline(polylineOptions, feature, geometry);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    updatePolyline(feature, geometry, style, context, primitive);
    return true;
  }
}
