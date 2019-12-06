goog.require('ol.proj');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.sync.getTransformFunction');

describe('plugin.cesium.sync.getTransformFunction', () => {
  const getTransformFunction = goog.module.get('plugin.cesium.sync.getTransformFunction');
  const proj = os.map.PROJECTION;

  afterEach(() => {
    os.map.PROJECTION = proj;
  });

  it('should return null for projections equivalent to EPSG:4326', () => {
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG4326);
    expect(getTransformFunction()).toBe(null);
  });

  it('should return a transform function for projections not equivalent to EPSG:4326', () => {
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG3857);
    const result = getTransformFunction();
    expect(result).toBeTruthy();

    // check that the result is cached
    expect(getTransformFunction()).toBe(result);
  });
});
