goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('os.interpolate');
goog.require('os.osasm.wait');

describe('os.interpolate', function() {
  // The accuracy of the calls should be tested in the opensphere-asm project itself.
  // We're just going to test whether it exists and is setting the fields/coords we
  // expect on the feature.

  it('should not interpolate points', function() {
    os.interpolate.enabled_ = true;
    var point = new ol.Feature(new ol.geom.Point([0, 0]));
    os.interpolate.interpolateFeature(point);
    expect(point.get(os.interpolate.ORIGINAL_GEOM_FIELD)).toBe(undefined);
  });

  it('should not interpolate multipoints', function() {
    os.interpolate.enabled_ = true;
    var multipoint = new ol.Feature(new ol.geom.MultiPoint([[0, 0], [2, 2]]));
    os.interpolate.interpolateFeature(multipoint);
    expect(multipoint.get(os.interpolate.ORIGINAL_GEOM_FIELD)).toBe(undefined);
  });

  it('should interpolate lines', function() {
    os.interpolate.enabled_ = true;
    var line = new ol.Feature(new ol.geom.LineString([[0, 0], [2, 2]]));
    os.interpolate.interpolateFeature(line);

    expect(line.getGeometry().getCoordinates().length).toBeGreaterThan(2);
    expect(line.get(os.interpolate.ORIGINAL_GEOM_FIELD)).toBeTruthy();
  });

  it('should interpolate polygons', function() {
    os.interpolate.enabled_ = true;
    var poly = new ol.Feature(new ol.geom.Polygon([[[0, 0], [0, 2], [2, 2], [0, 0]]]));
    os.interpolate.interpolateFeature(poly);
    expect(poly.getGeometry().getCoordinates()[0].length).toBeGreaterThan(7);
    expect(poly.get(os.interpolate.ORIGINAL_GEOM_FIELD)).toBeTruthy();
  });

  it('should interpolate lines with altitude/time', function() {
    os.interpolate.enabled_ = true;

    var startAlt = 1000;
    var endAlt = 10000;
    var altDiff = endAlt - startAlt;

    var startTime = 1504529300000;
    var endTime = 1504532800000;
    var timeDiff = endTime - startTime;

    var line = new ol.Feature(new ol.geom.LineString([[0, 0, startAlt, startTime], [2, 2, endAlt, endTime]]));
    os.interpolate.interpolateFeature(line);

    var coordinates = line.getGeometry().getCoordinates();
    expect(coordinates.length).toBeGreaterThan(2);

    coordinates.forEach(function(c, idx, arr) {
      var ratio = idx / (arr.length - 1);
      expect(c[2]).toBe(startAlt + altDiff * ratio);
      expect(c[3]).toBe(startTime + timeDiff * ratio);
    });
  });
});
