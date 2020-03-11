goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Style');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.PointConverter');


describe('plugin.cesium.sync.PointConverter', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const PointConverter = goog.module.get('plugin.cesium.sync.PointConverter');
  const pointConverter = new PointConverter();

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

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';

  setCircleStyle = (color) => {
    style.setImage(new ol.style.Circle({
      radius: 3,
      fill: new ol.style.Fill({
        color: color
      })
    }));
  };

  it('should not create anything if no image style exists', () => {
    pointConverter.create(feature, geometry, style, context);
    expect(context.billboards.length).toBe(0);
  });

  it('should create a billboard from a local canvas style', () => {
    setCircleStyle(green);
    const result = pointConverter.create(feature, geometry, style, context);
    expect(result).toBe(true);
    expect(context.billboards.length).toBe(1);

    const billboard = context.billboards.get(0);

    expect(billboard.color.red).toBeCloseTo(0, 12);
    expect(billboard.color.green).toBeCloseTo(1, 12);
    expect(billboard.color.blue).toBeCloseTo(0, 12);
    expect(billboard.color.alpha).toBeCloseTo(1, 12);

    expect(billboard.geomRevision).toBe(geometry.getRevision());
    expect(billboard.scale).toBeCloseTo(1, 12);
    expect(billboard.rotation).toBeCloseTo(0, 12);

    expect(billboard.alignedAxis.x).toBeCloseTo(Cesium.Cartesian3.UNIT_Z.x, 12);
    expect(billboard.alignedAxis.y).toBeCloseTo(Cesium.Cartesian3.UNIT_Z.y, 12);
    expect(billboard.alignedAxis.z).toBeCloseTo(Cesium.Cartesian3.UNIT_Z.z, 12);

    expect(billboard.heightReference).toBe(Cesium.HeightReference.NONE);
    expect(billboard.horizontalOrigin).toBe(Cesium.HorizontalOrigin.CENTER);
    expect(billboard.verticalOrigin).toBe(Cesium.VerticalOrigin.CENTER);
  });

  it('should create a billboard for an icon style', () => {
    style.setImage(new ol.style.Icon({
      anchor: [0.5, 1.0],
      crossOrigin: 'none',
      src: '/base/images/icons/pushpin/wht-pushpin.png',
      opacity: 0.5,
      scale: 0.8,
      size: [10, 20],
      rotation: 90
    }));

    const result = pointConverter.create(feature, geometry, style, context);
    expect(result).toBe(true);
    expect(context.billboards.length).toBe(1);

    const imageStyle = style.getImage();
    const billboard = context.billboards.get(0);
    expect(billboard.image).toBe(imageStyle.getSrc());

    expect(billboard.color.red).toBeCloseTo(1, 12);
    expect(billboard.color.blue).toBeCloseTo(1, 12);
    expect(billboard.color.green).toBeCloseTo(1, 12);
    expect(billboard.color.alpha).toBeCloseTo(0.5, 12);

    expect(billboard.scale).toBeCloseTo(imageStyle.getScale(), 12);
    expect(billboard.rotation).toBeCloseTo(-imageStyle.getRotation(), 0); // yes, opposite direction

    expect(billboard.horizontalOrigin).toBe(Cesium.HorizontalOrigin.RIGHT);
    expect(billboard.verticalOrigin).toBe(Cesium.VerticalOrigin.BOTTOM);

    expect(billboard.pixelOffset.x).toBeCloseTo(imageStyle.getScale() * (
      imageStyle.getSize()[0] - imageStyle.getAnchor()[0]), 12);
    expect(billboard.pixelOffset.y).toBeCloseTo(imageStyle.getScale() * (
      imageStyle.getSize()[1] - imageStyle.getAnchor()[1]), 12);
  });

  it('should create a billboard for a colored icon style', () => {
    style.setImage(new ol.style.Icon({
      anchor: [0.5, 1.0],
      crossOrigin: 'none',
      src: '/base/images/icons/pushpin/wht-pushpin.png',
      color: green,
      opacity: 0.5,
      scale: 0.8,
      size: [10, 20],
      rotation: 90
    }));

    const result = pointConverter.create(feature, geometry, style, context);
    expect(result).toBe(true);
    expect(context.billboards.length).toBe(1);

    const imageStyle = style.getImage();
    const billboard = context.billboards.get(0);
    expect(billboard.image).toBe(imageStyle.getSrc());

    expect(billboard.color.red).toBeCloseTo(0, 12);
    expect(billboard.color.blue).toBeCloseTo(0, 12);
    expect(billboard.color.green).toBeCloseTo(1, 12);
    expect(billboard.color.alpha).toBeCloseTo(0.5, 12);

    expect(billboard.scale).toBeCloseTo(imageStyle.getScale(), 12);
    expect(billboard.rotation).toBeCloseTo(-imageStyle.getRotation(), 0); // yes, opposite direction

    expect(billboard.horizontalOrigin).toBe(Cesium.HorizontalOrigin.RIGHT);
    expect(billboard.verticalOrigin).toBe(Cesium.VerticalOrigin.BOTTOM);

    expect(billboard.pixelOffset.x).toBeCloseTo(imageStyle.getScale() * (
      imageStyle.getSize()[0] - imageStyle.getAnchor()[0]), 12);
    expect(billboard.pixelOffset.y).toBeCloseTo(imageStyle.getScale() * (
      imageStyle.getSize()[1] - imageStyle.getAnchor()[1]), 12);
  });

  it('should create a billboard and transform other projection coordinates', () => {
    // pretend we swapped to EPSG:3857
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG3857);

    style.setImage(new ol.style.Icon({
      anchor: [0.5, 1.0],
      crossOrigin: 'none',
      src: '/base/images/icons/pushpin/wht-pushpin.png',
      color: green,
      opacity: 0.5,
      scale: 0.8,
      rotation: 90
    }));

    geometry.setCoordinates(ol.proj.transform([-105, 40], os.proj.EPSG4326, os.proj.EPSG3857));

    const result = pointConverter.create(feature, geometry, style, context);
    expect(result).toBe(true);
    expect(context.billboards.length).toBe(1);

    const billboard = context.billboards.get(0);
    const expectedPosition = Cesium.Cartesian3.fromDegrees(-105, 40, 0);

    expect(billboard.position.x).toBeCloseTo(expectedPosition.x, 12);
    expect(billboard.position.y).toBeCloseTo(expectedPosition.y, 12);
    expect(billboard.position.z).toBeCloseTo(expectedPosition.z, 12);
  });

  it('should not update anything if no image style exists', () => {
    const result = pointConverter.update(feature, geometry, style, context, {});
    expect(result).toBe(false);
  });

  it('should update a billboard which already exists', () => {
    setCircleStyle(green);
    pointConverter.create(feature, geometry, style, context);

    const billboard = context.billboards.get(0);
    const image = billboard._image;

    billboard.dirty = true;
    setCircleStyle(blue);

    const result = pointConverter.update(feature, geometry, style, context, billboard);
    expect(result).toBe(true);
    expect(context.billboards.length).toBe(1);
    const updatedBillboard = context.billboards.get(0);
    expect(updatedBillboard).toBe(billboard);
    expect(billboard.dirty).toBe(false);

    expect(billboard._image).toBe(image);
  });
});
