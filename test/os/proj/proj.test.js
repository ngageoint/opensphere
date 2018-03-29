goog.require('os.proj');

describe('os.proj', function() {
  describe('getBestSupportedProjections()', function() {
    it('should get the best supported projection', function() {
      var conf = {
        id: 'test',
        projection: os.proj.EPSG3857
      };

      var projection = os.proj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(os.proj.EPSG3857);

      conf.projection = os.proj.EPSG4326;
      projection = os.proj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(os.proj.EPSG4326);
    });

    it('should return null if no supported projections exist', function() {
      var conf = {
        id: 'test',
        projection: 'EPSG:27700'
      };

      expect(os.proj.getBestSupportedProjection(conf)).toBe(null);
    });

    it('should return the application projection if no projections are specified', function() {
      expect(os.proj.getBestSupportedProjection({id: 'test'})).toBe(os.map.PROJECTION);
    });

    it('should return the supported projection if multiple projections exist', function() {
      var conf = {
        id: 'test',
        projections: ['EPSG:27700', os.proj.EPSG4326]
      };

      var projection = os.proj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(os.proj.EPSG4326);
    });

    it('should prefer the application projection over others', function() {
      var conf = {
        id: 'test',
        projection: os.proj.EPSG3857,
        projections: ['EPSG:27700', os.proj.EPSG4326, os.proj.EPSG3857]
      };

      var projection = os.proj.getBestSupportedProjection(conf);
      expect(projection).not.toBe(null);
      expect(projection.getCode()).toBe(os.map.PROJECTION.getCode());
    });
  });
});
