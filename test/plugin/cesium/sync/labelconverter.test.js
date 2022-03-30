goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.LabelConverter');
goog.require('test.plugin.cesium.primitive');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.style');

import {getCenter} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {get, transform} from 'ol/src/proj.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';
import Text from 'ol/src/style/Text.js';

describe('plugin.cesium.sync.LabelConverter', () => {
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: LabelConverter} = goog.module.get('plugin.cesium.sync.LabelConverter');
  const {testColor} = goog.module.get('test.plugin.cesium.sync.style');
  const labelConverter = new LabelConverter();

  let feature;
  let geometry;
  let style;
  let context;
  let layer;
  let scene;

  beforeEach(() => {
    geometry = new Point([0, 0]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    osMap.setProjection(originalProjection);
  });

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';

  describe('retrieve', () => {
    it('should not retrieve from the geometry set', () => {
      const billboard = primitiveUtils.createBillboard(geometry.getCoordinates());
      context.addBillboard(billboard, feature, geometry);
      expect(context.getPrimitiveForGeometry(geometry)).toBeTruthy();
      expect(labelConverter.retrieve(feature, geometry, style, context)).toBe(null);
    });

    it('should retrieve from the label set', () => {
      context.addLabel(primitiveUtils.createLabelOptions('Test'), feature, geometry);
      expect(labelConverter.retrieve(feature, geometry, style, context)).toBe(context.labels.get(0));
    });
  });

  describe('create', () => {
    it('should not attempt to process empty text styles', () => {
      expect(labelConverter.create(feature, geometry, style, context)).toBe(false);
    });

    it('should process text styles', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);
    });

    it('should position itself at the extent center for polygons', () => {
      geometry = fromExtent([5, 5, 10, 10]);
      style.setText(new Text({
        text: 'Test'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      const center = getCenter(geometry.getExtent());
      const expectedPosition = Cesium.Cartesian3.fromDegrees(center[0], center[1], 0);

      expect(label.position.x).toBeCloseTo(expectedPosition.x, 12);
      expect(label.position.y).toBeCloseTo(expectedPosition.y, 12);
      expect(label.position.z).toBeCloseTo(expectedPosition.z, 12);
    });

    it('should create a label and transform other projection coordinates', () => {
      // pretend we swapped to EPSG:3857
      osMap.setProjection(get(osProj.EPSG3857));

      style.setText(new Text({
        text: 'Test'
      }));

      geometry.setCoordinates(transform([-105, 40], osProj.EPSG4326, osProj.EPSG3857));
      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      const expectedPosition = Cesium.Cartesian3.fromDegrees(-105, 40, 0);

      expect(label.position.x).toBeCloseTo(expectedPosition.x, 12);
      expect(label.position.y).toBeCloseTo(expectedPosition.y, 12);
      expect(label.position.z).toBeCloseTo(expectedPosition.z, 12);
    });

    it('should properly read styles with neither a stroke nor a fill', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      style.getText().setFill(null);
      style.getText().setStroke(null);

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.style).toBeFalsy();
    });

    it('should properly read styles with a fill but no stroke', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      style.getText().setFill(new Fill({
        color: green
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.style).toBe(Cesium.LabelStyle.FILL);

      testColor(label.fillColor, green);
    });

    it('should properly read styles with a stroke but no fill', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      style.getText().setFill(null);
      style.getText().setStroke(new Stroke({
        color: blue,
        width: 2
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.style).toBe(Cesium.LabelStyle.OUTLINE);

      testColor(label.outlineColor, blue);
      expect(label.outlineWidth).toBe(2);
    });

    it('should properly read styles with both a stroke and a fill', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      style.getText().setFill(new Fill({
        color: green
      }));

      style.getText().setStroke(new Stroke({
        color: blue,
        width: 2
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.style).toBe(Cesium.LabelStyle.FILL_AND_OUTLINE);

      testColor(label.fillColor, green);
      testColor(label.outlineColor, blue);
      expect(label.outlineWidth).toBe(2);
    });

    it('should properly read styles with a textAlign value', () => {
      style.setText(new Text({
        text: 'Test',
        textAlign: 'right'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.horizontalOrigin).toBe(Cesium.HorizontalOrigin.RIGHT);
    });

    it('should fail when a bad textAlign value is found', () => {
      style.setText(new Text({
        text: 'Test',
        textAlign: 'bogus'
      }));

      expect(() => labelConverter.create(feature, geometry, style, context)).toThrow();
    });

    it('should properly read styles with a textBaseline value', () => {
      style.setText(new Text({
        text: 'Test',
        textBaseline: 'bottom'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(label.verticalOrigin).toBe(Cesium.VerticalOrigin.BOTTOM);
    });

    it('should fail when a bad textBaseline value is found', () => {
      style.setText(new Text({
        text: 'Test',
        textBaseline: 'bogus'
      }));

      expect(() => labelConverter.create(feature, geometry, style, context)).toThrow();
    });
  });

  describe('update', () => {
    it('should not operate on destroyed items', () => {
      context.addLabel(primitiveUtils.createLabelOptions('Test'), feature, geometry);

      style.setText(new Text({
        text: 'Test 1'
      }));

      const label = labelConverter.retrieve(feature, geometry, style, context);
      spyOn(label, 'isDestroyed').andReturn(true);
      expect(labelConverter.update(feature, geometry, style, geometry, label)).toBe(false);
    });

    it('should use the style\'s geometry when available', () => {
      style.setGeometry(new Point([10, 15]));

      style.setText(new Text({
        text: 'Test 1'
      }));

      const options = {};
      expect(labelConverter.update(feature, geometry, style, context, options)).toBe(true);
      context.addLabel(options, feature, geometry);

      const expectedPosition = Cesium.Cartesian3.fromDegrees(10, 15, 0);
      expect(options.position.x).toBeCloseTo(expectedPosition.x, 12);
      expect(options.position.y).toBeCloseTo(expectedPosition.y, 12);
      expect(options.position.z).toBeCloseTo(expectedPosition.z, 12);

      const label = labelConverter.retrieve(feature, geometry, style, context);
      expect(label).toBeTruthy();
      expect(label.olFeature).toBe(feature);
      expect(label.olGeometry).toBe(geometry);
    });

    it('should fall back on using the original geometry', () => {
      style.setText(new Text({
        text: 'Test 1'
      }));

      const options = {};
      expect(labelConverter.update(feature, geometry, style, context, options)).toBe(true);
      context.addLabel(options, feature, geometry);

      const expectedPosition = Cesium.Cartesian3.fromDegrees(0, 0, 0);
      expect(options.position.x).toBeCloseTo(expectedPosition.x, 12);
      expect(options.position.y).toBeCloseTo(expectedPosition.y, 12);
      expect(options.position.z).toBeCloseTo(expectedPosition.z, 12);

      const label = labelConverter.retrieve(feature, geometry, style, context);
      expect(label).toBeTruthy();
      expect(label.olFeature).toBe(feature);
      expect(label.olGeometry).toBe(geometry);
    });

    it('should update dirty items', () => {
      style.setText(new Text({
        text: 'Test'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      const label = labelConverter.retrieve(feature, geometry, style, context);
      expect(label).toBeTruthy();
      label.dirty = true;

      style.getText().setText('Test 2');

      expect(labelConverter.update(feature, geometry, style, context, label)).toBe(true);
      expect(label.dirty).toBe(false);
    });

    it('should set show to the same as the main geometry', () => {
      spyOn(context, 'getPrimitiveForGeometry').andReturn({
        show: false
      });

      style.setText(new Text({
        text: 'Test'
      }));

      expect(labelConverter.create(feature, geometry, style, context)).toBe(true);
      const label = labelConverter.retrieve(feature, geometry, style, context);
      expect(label.show).toBe(false);
    });
  });
});
