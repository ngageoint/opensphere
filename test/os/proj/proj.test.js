goog.require('os.map');
goog.require('os.proj');

describe('os.proj', function() {
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');

  describe('getBestSupportedProjections()', function() {
    it('should get the best supported projection', function() {
      var conf = {
        id: 'test',
        projection: osProj.EPSG3857
      };

      var projection = osProj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(osProj.EPSG3857);

      conf.projection = osProj.EPSG4326;
      projection = osProj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(osProj.EPSG4326);
    });

    it('should return null if no supported projections exist', function() {
      var conf = {
        id: 'test',
        projection: 'EPSG:27700'
      };

      expect(osProj.getBestSupportedProjection(conf)).toBe(null);
    });

    it('should return the application projection if no projections are specified', function() {
      expect(osProj.getBestSupportedProjection({id: 'test'})).toBe(osMap.PROJECTION);
    });

    it('should return the supported projection if multiple projections exist', function() {
      var conf = {
        id: 'test',
        projections: ['EPSG:27700', osProj.EPSG4326]
      };

      var projection = osProj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(osProj.EPSG4326);
    });

    it('should prefer the application projection over others', function() {
      var conf = {
        id: 'test',
        projection: osProj.EPSG3857,
        projections: ['EPSG:27700', osProj.EPSG4326, osProj.EPSG3857]
      };

      var projection = osProj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(osMap.PROJECTION.getCode());
    });
  });
});
