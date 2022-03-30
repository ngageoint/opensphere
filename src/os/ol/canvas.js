goog.declareModuleId('os.ol.canvas');

import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

import {interpolateEllipse} from '../geo/geo.js';


/**
 * Create an ellipse geometry.
 *
 * @param {!ol.Coordinate} center The center of the ellipse.
 * @param {number} size The ellipse size, in pixels.
 * @param {boolean=} opt_showCenter If the center point should be displayed.
 * @return {!(GeometryCollection|Polygon)} The ellipse geometry.
 */
export const createEllipseGeometry = function(center, size, opt_showCenter) {
  var geometry;
  var showCenter = !!opt_showCenter;

  // ellipse interpolation assumes cartesian coordinates and adjusts based on the ellipsoid. reduce the center
  // pixel coordinates drastically so the computation assumes we're near the equator and provides a clean ellipse.
  var factor = 1000000;
  var ellipseCenter = [center[0] / factor, center[1] / factor];

  var a = size / 25;
  var b = a * 0.66;
  var points = interpolateEllipse(ellipseCenter, a, b, -45);
  for (var i = 0; i < points.length - 1; i++) {
    points[i][0] = points[i][0] * factor;
    points[i][1] = points[i][1] * factor;
  }

  var ellipse = new Polygon([points]);
  if (showCenter) {
    geometry = new GeometryCollection([ellipse, new Point(center)]);
  } else {
    geometry = ellipse;
  }

  return geometry;
};
