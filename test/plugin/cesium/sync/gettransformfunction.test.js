goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.sync.getTransformFunction');

import {get} from 'ol/src/proj.js';

describe('plugin.cesium.sync.getTransformFunction', () => {
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');
  const {getTransformFunction} = goog.module.get('plugin.cesium.sync.getTransformFunction');
  const proj = osMap.PROJECTION;

  afterEach(() => {
    osMap.setProjection(proj);
  });

  it('should return null for projections equivalent to EPSG:4326', () => {
    osMap.setProjection(get(osProj.EPSG4326));
    expect(getTransformFunction()).toBe(null);
  });

  it('should return a transform function for projections not equivalent to EPSG:4326', () => {
    osMap.setProjection(get(osProj.EPSG3857));
    const result = getTransformFunction();
    expect(result).toBeTruthy();

    // check that the result is cached
    expect(getTransformFunction()).toBe(result);
  });

  it('should transform coordinates', () => {
    osMap.setProjection(get(osProj.EPSG3857));
    const tx = getTransformFunction();
    const coord = [0, 0];
    const result = tx(coord);

    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBe(coord);
  });

  it('should copy dimensions outside of x/y to the output', () => {
    osMap.setProjection(get(osProj.EPSG3857));
    const tx = getTransformFunction();
    const coord = [0, 0, 100];
    const result = tx(coord);

    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBe(coord);

    expect(result[0]).toBeCloseTo(0, 12);
    expect(result[1]).toBeCloseTo(0, 12);
    expect(result[2]).toBeCloseTo(100, 12);
  });

  it('should use the optional result', () => {
    osMap.setProjection(get(osProj.EPSG3857));
    const tx = getTransformFunction();
    const coord = [0, 0, 100];
    const result = [];
    const output = tx(coord, result);

    expect(result).not.toBe(coord);
    expect(output).toBe(result);
    expect(result.length).toBe(3);
  });

  it('should use the given dimensions size', () => {
    osMap.setProjection(get(osProj.EPSG3857));
    const tx = getTransformFunction();
    const coord = [0, 0, 100];
    const result = [];
    const output = tx(coord, result, 4);

    expect(result).not.toBe(coord);
    expect(output).toBe(result);
    expect(result.length).toBe(4);
    expect(result[3]).toBe(undefined);
  });
});
