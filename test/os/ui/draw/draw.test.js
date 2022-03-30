goog.require('os.map');
goog.require('os.proj');
goog.require('os.style.area');
goog.require('os.ui.draw');

import Feature from 'ol/src/Feature.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {transformExtent} from 'ol/src/proj.js';

describe('os.ui.draw', function() {
  const osMap = goog.module.get('os.map');
  const {EPSG4326} = goog.module.get('os.proj');
  const {GRID_STYLE} = goog.module.get('os.style.area');
  const {getGridFromFeature} = goog.module.get('os.ui.draw');

  // reusable geometry / feature for testing
  var g = fromExtent(transformExtent([0.05, 0.05, 0.15, 0.15], EPSG4326, osMap.PROJECTION));
  var feature = new Feature({geometry: g});

  it('should create a "detail x detail" grid around a feature, snapped to the world Lat/Lon coodinates', function() {
    runs(function() {
      var options = /** @type {!osx.ui.draw.GridOptions} */ ({
        detail: 0.1,
        max: 20.0,
        style: GRID_STYLE
      });

      var grid = getGridFromFeature(feature, options);

      expect(grid).toBeDefined();
      expect(grid.length).toBe(4); // since detail is 0.1, the 0.05 to 0.15 extent will get a 2x2 grid from 0.0 to 0.2 drawn around it
    });
  });

  it('should not create a grid without valid GridOptions', function() {
    runs(function() {
      var options = /** @type {!osx.ui.draw.GridOptions} */ ({
        detail: 1.0,
        max: -3.0,
        style: null
      });

      var grid = getGridFromFeature(feature, options);

      expect(grid).toBeNull(); // does not calculate, since GridOptions are bad
    });
  });

  it('should not create a grid which would make too many features, max=1 for this test', function() {
    runs(function() {
      var options = /** @type {!osx.ui.draw.GridOptions} */ ({
        detail: 0.1,
        max: 1.0,
        style: GRID_STYLE
      });

      var grid = getGridFromFeature(feature, options);

      expect(grid).toBeNull(); // does not calculate the 2x2 grid, since 4 > max
    });
  });
});
