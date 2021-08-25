goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.proj');
goog.require('os.query.utils');

describe('os.query.utils', function() {
  const osMap = goog.module.get('os.map');

  it('should detect world queries properly', function() {
    var tests = [{
      extent: [-180, -90, 180, 90],
      expected: true
    }, {
      extent: [-179, -89, 179, 89],
      expected: false
    }, {
      extent: [-179, -83, 179, 83],
      expected: false
    }];

    var projections = ['EPSG:4326', 'EPSG:3857'];
    var oldProjection = osMap.PROJECTION;

    projections.forEach(function(code) {
      var proj = ol.proj.get(code);
      osMap.setProjection(proj);
      os.query.utils.initWorldArea();

      tests.forEach(function(test) {
        var extent = ol.proj.transformExtent(test.extent, os.proj.EPSG4326, proj);
        var geom = ol.geom.Polygon.fromExtent(extent);
        expect(os.query.utils.isWorldQuery(geom)).toBe(test.expected);
      });
    });

    osMap.setProjection(oldProjection);
  });
});
