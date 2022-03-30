goog.require('os.interpolate');
goog.require('os.osasm.wait');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('os.interpolate', function() {
  const interpolate = goog.module.get('os.interpolate');

  // The accuracy of the calls should be tested in the opensphere-asm project itself.
  // We're just going to test whether it exists and is setting the fields/coords we
  // expect on the feature.

  it('should not interpolate points', function() {
    interpolate.setEnabled(true);
    var point = new Feature(new Point([0, 0]));
    interpolate.interpolateFeature(point);
    expect(point.get(interpolate.ORIGINAL_GEOM_FIELD)).toBe(undefined);
  });

  it('should not interpolate multipoints', function() {
    interpolate.setEnabled(true);
    var multipoint = new Feature(new MultiPoint([[0, 0], [2, 2]]));
    interpolate.interpolateFeature(multipoint);
    expect(multipoint.get(interpolate.ORIGINAL_GEOM_FIELD)).toBe(undefined);
  });

  it('should interpolate lines', function() {
    interpolate.setEnabled(true);
    var line = new Feature(new LineString([[0, 0], [2, 2]]));
    interpolate.interpolateFeature(line);

    expect(line.getGeometry().getCoordinates().length).toBeGreaterThan(2);
    expect(line.get(interpolate.ORIGINAL_GEOM_FIELD)).toBeTruthy();
  });

  it('should interpolate polygons', function() {
    interpolate.setEnabled(true);
    var poly = new Feature(new Polygon([[[0, 0], [0, 2], [2, 2], [0, 0]]]));
    interpolate.interpolateFeature(poly);
    expect(poly.getGeometry().getCoordinates()[0].length).toBeGreaterThan(7);
    expect(poly.get(interpolate.ORIGINAL_GEOM_FIELD)).toBeTruthy();
  });

  it('should interpolate lines with altitude/time', function() {
    interpolate.setEnabled(true);

    var startAlt = 1000;
    var endAlt = 10000;
    var altDiff = endAlt - startAlt;

    var startTime = 1504529300000;
    var endTime = 1504532800000;
    var timeDiff = endTime - startTime;

    var line = new Feature(new LineString([[0, 0, startAlt, startTime], [2, 2, endAlt, endTime]]));
    interpolate.interpolateFeature(line);

    var coordinates = line.getGeometry().getCoordinates();
    expect(coordinates.length).toBeGreaterThan(2);

    coordinates.forEach(function(c, idx, arr) {
      var ratio = idx / (arr.length - 1);
      expect(c[2]).toBe(startAlt + altDiff * ratio);
      expect(c[3]).toBe(startTime + timeDiff * ratio);
    });
  });
});
