goog.require('os.MapContainer');
goog.require('os.layer');
goog.require('os.layer.MockLayer');


describe('os.layer', function() {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const MockLayer = goog.module.get('os.layer.MockLayer');
  const osLayer = goog.module.get('os.layer');

  it('gets a layer title by id', function() {
    var id = 'mocklayer';
    var title = 'Test Title';

    var layer = new MockLayer();
    layer.setId(id);
    layer.setTitle(title);

    spyOn(MapContainer.prototype, 'getLayer').andReturn(layer);

    expect(osLayer.getTitle(id)).toBe(title);
    expect(osLayer.getTitle(id, false)).toBe(title);
    expect(osLayer.getTitle(id, true)).toBe(title + ' ' + layer.getExplicitType());
  });

  it('finds unique layer titles', function() {
    var layers = [];
    var title = 'Test Title';

    spyOn(MapContainer.prototype, 'getLayers').andReturn(layers);

    // calls return the same value while the layer doesn't exist
    expect(osLayer.getUniqueTitle(title)).toBe(title);
    expect(osLayer.getUniqueTitle(title)).toBe(title);

    var layer = new MockLayer();
    layer.title = title;
    layers.push(layer);

    var nextTitle = osLayer.getUniqueTitle(title);
    expect(nextTitle).toBe(title + ' [1]');

    layer = new MockLayer();
    layer.title = nextTitle;
    layers.push(layer);

    nextTitle = osLayer.getUniqueTitle(title);
    expect(nextTitle).toBe(title + ' [2]');

    layer = new MockLayer();
    layer.title = nextTitle;
    layers.push(layer);

    expect(osLayer.getUniqueTitle(title)).toBe(title + ' [3]');

    // remove the [1] layer
    layers.splice(1);
    expect(osLayer.getUniqueTitle(title)).toBe(title + ' [1]');

    // remove all layers
    layers.length = 0;
    expect(osLayer.getUniqueTitle(title)).toBe(title);
  });
});
