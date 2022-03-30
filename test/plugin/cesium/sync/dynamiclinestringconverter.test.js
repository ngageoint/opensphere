goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.DynamicLineStringConverter');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.dynamiclinestring');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import {get} from 'ol/src/proj.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.DynamicLineStringConverter', () => {
  const {default: Vector} = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const {EPSG4326} = goog.module.get('os.proj');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: DynamicLineStringConverter} = goog.module.get('plugin.cesium.sync.DynamicLineStringConverter');

  const {testLine} = goog.module.get('test.plugin.cesium.sync.dynamiclinestring');
  const {getRealScene, renderScene} = goog.module.get('test.plugin.cesium.scene');

  const lineStringConverter = new DynamicLineStringConverter();

  let feature;
  let geometry;
  let style;
  let context;
  let layer;
  let scene;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new LineString([[0, 0], [5, 5]]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new Vector();
    scene = getRealScene();
    context = new VectorContext(scene, layer, get(EPSG4326));
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    disableWebGLMock();
    osMap.setProjection(originalProjection);
  });

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';

  describe('create', () => {
    it('should create a line', () => {
      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.polylines.length).toBe(1);
      testLine(context.polylines.get(0));
    });

    it('should create a line with a given stroke style', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(context.polylines.get(0), {color: green, width: 4});
    });

    it('should create a dashed line if the stroke contains a dash', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([12, 4]);
      style.setStroke(stroke);

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(context.polylines.get(0), {
        color: green,
        dashPattern: parseInt('1111111111110000', 2),
        width: 1
      });
    });
  });

  describe('update', () => {
    it('should update changing line widths', () => {
      style.setStroke(new Stroke({
        color: blue,
        width: 3
      }));

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.polylines.get(0);

      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(true);
    });

    it('should update changing dash patterns', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([12, 4]);
      style.setStroke(stroke);

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.polylines.get(0);
      stroke.setLineDash([8, 8]);

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(true);
    });

    it('should update lines with new colors', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      let result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      const linestring = context.polylines.get(0);
      linestring._asynchronous = false;
      renderScene(scene);

      testLine(linestring, {
        color: green,
        width: 4,
        cleanedGeometryInstances: true
      });

      style.getStroke().setColor(blue);

      linestring.dirty = true;
      result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(true);

      testLine(linestring, {
        color: blue,
        width: 4,
        cleanedGeometryInstances: true
      });

      expect(linestring.dirty).toBe(false);
    });
  });
});
