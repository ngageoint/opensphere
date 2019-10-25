goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.map');
goog.require('os.ui.draw');
goog.require('os.ui.draw.GridOptions');

ddescribe('os.ui.draw', function() {
  window.localStorage.clear();
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

  beforeEach(function() {
    window.localStorage.clear();
  });

  it('should read grid settings as numbers', function() {
    runs(function() {
      var gridDetail = os.ui.draw.getGridSetting(os.ui.draw.GRID_DETAIL, 0.1);
      expect(gridDetail).toBeDefined();
      expect(typeof gridDetail == 'number').toBeTruthy();
    });
  });

  it('should create a "detail x detail" grid around a feature, snapped to the world Lat/Lon coodinates', function() {
    runs(function() {
      var options = new os.ui.draw.GridOptions(0.1, 100);

      var g = ol.geom.Polygon
        .fromExtent(
          ol.proj.transformExtent(
            [0.05, 0.05, 0.15, 0.15],
            os.proj.EPSG4326,
            os.map.PROJECTION));
      var feature = new ol.Feature({geometry: g});

      var grid = os.ui.draw.getGridFromFeature(feature, options);

      expect(grid).toBeDefined();
      expect(grid.length).toBe(4); // since detail is 0.1, the 0.05 to 0.15 extent will get a 2x2 grid from 0.0 to 0.2 drawn around it
    });
  });
});
