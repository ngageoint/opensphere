goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Style');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.LabelConverter');


describe('plugin.cesium.sync.LabelConverter', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const LabelConverter = goog.module.get('plugin.cesium.sync.LabelConverter');
  const labelConverter = new LabelConverter();

  let feature;
  let geometry;
  let style;
  let context;

  beforeEach(() => {
    geometry = new ol.geom.Point([0, 0]);
    feature = new ol.Feature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
  });

  const originalProjection = os.map.PROJECTION;
  afterEach(() => {
    os.map.PROJECTION = originalProjection;
  });
});
