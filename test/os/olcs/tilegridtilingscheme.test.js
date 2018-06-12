goog.require('ol.tilegrid');
goog.require('ol.source.TileImage');
goog.require('os.proj');
goog.require('os.olcs.TileGridTilingScheme');


describe('os.olcs.TileGridTilingScheme', function() {
  beforeEach(function() {
    os.olcs.TileGridTilingScheme.init();
  });

  it('should match WebMercatorTilingScheme', function() {
    var projection = ol.proj.get(os.proj.EPSG3857);
    var tilegrid = ol.tilegrid.createForProjection(projection, ol.DEFAULT_MAX_ZOOM, [256, 256]);

    var source = new ol.source.TileImage({
      projection: projection,
      tileGrid: tilegrid,
      wrapX: projection.isGlobal()
    });

    var scheme = new os.olcs.TileGridTilingScheme(source);
    var matchScheme = new Cesium.WebMercatorTilingScheme();

    // check basics
    expect(scheme.ellipsoid).toBe(matchScheme.ellipsoid);
    expect(scheme.projection instanceof Cesium.WebMercatorProjection).toBe(true);

    expect(scheme.rectangle.west).toBeCloseTo(matchScheme.rectangle.west, 1E-12);
    expect(scheme.rectangle.south).toBeCloseTo(matchScheme.rectangle.south, 1E-12);
    expect(scheme.rectangle.east).toBeCloseTo(matchScheme.rectangle.east, 1E-12);
    expect(scheme.rectangle.north).toBeCloseTo(matchScheme.rectangle.north, 1E-12);

    // geodetic radians to native coord transform
    var rect = new Cesium.Rectangle(0, 0, 10 * os.geo.D2R, 10 * os.geo.D2R);
    var expectedRect = matchScheme.rectangleToNativeRectangle(rect);
    var result = scheme.rectangleToNativeRectangle(rect);

    expect(result.west).toBeCloseTo(expectedRect.west, 1E-12);
    expect(result.south).toBeCloseTo(expectedRect.south, 1E-12);
    expect(result.east).toBeCloseTo(expectedRect.east, 1E-12);
    expect(result.north).toBeCloseTo(expectedRect.north, 1E-12);

    var projExtent = projection.getExtent();
    var north = projExtent[3];
    var west = projExtent[0];
    var width = ol.extent.getWidth(projExtent);
    var height = ol.extent.getHeight(projExtent);

    var pos = new Cesium.Cartesian2();
    var lonlat = new Cesium.Cartographic();

    // tile x,y coord to geodetic radian rectangle
    // check tile numbers at some levels
    for (var z = 0, zz = 3; z <= zz; z++) {
      var xx = matchScheme.getNumberOfXTilesAtLevel(z);
      var yy = matchScheme.getNumberOfYTilesAtLevel(z);

      expect(scheme.getNumberOfXTilesAtLevel(z)).toBe(xx);
      expect(scheme.getNumberOfYTilesAtLevel(z)).toBe(yy);

      for (var y = 0; y < yy; y++) {
        for (var x = 0; x < xx; x++) {
          expectedRect = matchScheme.tileXYToRectangle(x, y, z, expectedRect);
          result = scheme.tileXYToRectangle(x, y, z, result);
          expect(result.west).toBeCloseTo(expectedRect.west, 1E-12);
          expect(result.south).toBeCloseTo(expectedRect.south, 1E-12);
          expect(result.east).toBeCloseTo(expectedRect.east, 1E-12);
          expect(result.north).toBeCloseTo(expectedRect.north, 1E-12);

          pos.x = west + x * width / xx;
          pos.y = north - y * height / yy;

          var coord = ol.proj.toLonLat([pos.x, pos.y], projection);
          lonlat.longitude = coord[0] * os.geo.D2R;
          lonlat.latitude = coord[1] * os.geo.D2R;

          var expectedTileCoord = matchScheme.positionToTileXY(lonlat, z, expectedTileCoord);
          var tileCoord = scheme.positionToTileXY(lonlat, z, tileCoord);

          if (tileCoord.x !== expectedTileCoord.x || tileCoord.y !== expectedTileCoord.y) {
            console.log(z, 'nw expected', expectedTileCoord, 'result', tileCoord);
            tileCoord = scheme.positionToTileXY(lonlat, z, tileCoord);
          }

          expect(tileCoord.x).toBe(expectedTileCoord.x);
          expect(tileCoord.y).toBe(expectedTileCoord.y);
        }
      }
    }
  });


  xit('should match GeographicTilingScheme', function() {
    var projection = ol.proj.get(os.proj.EPSG4326);
    var tilegrid = ol.tilegrid.createForProjection(projection, ol.DEFAULT_MAX_ZOOM, [256, 256]);

    var source = new ol.source.TileImage({
      projection: projection,
      tileGrid: tilegrid,
      wrapX: projection.isGlobal()
    });

    var scheme = new os.olcs.TileGridTilingScheme(source);
    var matchScheme = new Cesium.GeographicTilingScheme();

    // check basics
    expect(scheme.ellipsoid).toBe(matchScheme.ellipsoid);
    expect(scheme.projection instanceof Cesium.GeographicProjection).toBe(true);

    expect(scheme.rectangle.west).toBeCloseTo(matchScheme.rectangle.west, 1E-12);
    expect(scheme.rectangle.south).toBeCloseTo(matchScheme.rectangle.south, 1E-12);
    expect(scheme.rectangle.east).toBeCloseTo(matchScheme.rectangle.east, 1E-12);
    expect(scheme.rectangle.north).toBeCloseTo(matchScheme.rectangle.north, 1E-12);

    // geodetic radians to native coord transform
    var rect = new Cesium.Rectangle(0, 0, 10 * os.geo.D2R, 10 * os.geo.D2R);
    var expectedRect = matchScheme.rectangleToNativeRectangle(rect);
    var result = scheme.rectangleToNativeRectangle(rect);

    expect(result.west).toBeCloseTo(expectedRect.west, 1E-12);
    expect(result.south).toBeCloseTo(expectedRect.south, 1E-12);
    expect(result.east).toBeCloseTo(expectedRect.east, 1E-12);
    expect(result.north).toBeCloseTo(expectedRect.north, 1E-12);

    var projExtent = projection.getExtent();
    var north = projExtent[3];
    var west = projExtent[0];
    var width = ol.extent.getWidth(projExtent);
    var height = ol.extent.getHeight(projExtent);

    var pos = new Cesium.Cartesian2();
    var lonlat = new Cesium.Cartographic();

    // tile x,y coord to geodetic radian rectangle
    // check tile numbers at some levels
    for (var z = 1, zz = 6; z <= zz; z++) {
      var xx = matchScheme.getNumberOfXTilesAtLevel(z - 1);
      var yy = matchScheme.getNumberOfYTilesAtLevel(z - 1);

      expect(scheme.getNumberOfXTilesAtLevel(z)).toBe(xx);
      expect(scheme.getNumberOfYTilesAtLevel(z)).toBe(yy);

      for (var y = 0; y < yy; y++) {
        for (var x = 0; x < xx; x++) {
          expectedRect = matchScheme.tileXYToRectangle(x, y, z - 1, expectedRect);
          result = scheme.tileXYToRectangle(x, y, z, result);
          expect(result.west).toBeCloseTo(expectedRect.west, 1E-12);
          expect(result.south).toBeCloseTo(expectedRect.south, 1E-12);
          expect(result.east).toBeCloseTo(expectedRect.east, 1E-12);
          expect(result.north).toBeCloseTo(expectedRect.north, 1E-12);

          pos.x = west + x * width / xx;
          pos.y = north - y * height / yy;

          var coord = ol.proj.toLonLat([pos.x, pos.y], projection);
          lonlat.longitude = coord[0] * os.geo.D2R;
          lonlat.latitude = coord[1] * os.geo.D2R;

          var expectedTileCoord = matchScheme.positionToTileXY(lonlat, z - 1, expectedTileCoord);
          var tileCoord = scheme.positionToTileXY(lonlat, z, tileCoord);

          if (tileCoord.x !== expectedTileCoord.x || tileCoord.y !== expectedTileCoord.y) {
            console.log(z, 'nw expected', expectedTileCoord, 'result', tileCoord);
            tileCoord = scheme.positionToTileXY(lonlat, z, tileCoord);
          }

          expect(tileCoord.x).toBe(expectedTileCoord.x);
          expect(tileCoord.y).toBe(expectedTileCoord.y);
        }
      }
    }
  });

});
