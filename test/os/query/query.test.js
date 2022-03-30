goog.require('os.proj');
goog.require('os.query.utils');

import {fromExtent} from 'ol/src/geom/Polygon.js';
import {get, transformExtent} from 'ol/src/proj.js';

describe('os.query.utils', function() {
  const osProj = goog.module.get('os.proj');
  const osMap = goog.module.get('os.map');
  const {initWorldArea, isWorldQuery} = goog.module.get('os.query.utils');

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
      var proj = get(code);
      osMap.setProjection(proj);
      initWorldArea();

      tests.forEach(function(test) {
        var extent = transformExtent(test.extent, osProj.EPSG4326, proj);
        var geom = fromExtent(extent);
        expect(isWorldQuery(geom)).toBe(test.expected);
      });
    });

    osMap.setProjection(oldProjection);
  });
});
