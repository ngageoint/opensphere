goog.require('os.MapContainer');
goog.require('os.layer');
goog.require('os.layer.MockLayer');


describe('os.layer', function() {
  it('gets a layer title by id', function() {
    var id = 'mocklayer';
    var title = 'Test Title';

    var layer = new os.layer.MockLayer();
    layer.setId(id);
    layer.setTitle(title);

    spyOn(os.MapContainer.prototype, 'getLayer').andReturn(layer);

    expect(os.layer.getTitle(id)).toBe(title);
    expect(os.layer.getTitle(id, false)).toBe(title);
    expect(os.layer.getTitle(id, true)).toBe(title + ' ' + layer.getExplicitType());
  });

  it('finds unique layer titles', function() {
    var layers = [];
    var title = 'Test Title';

    spyOn(os.MapContainer.prototype, 'getLayers').andReturn(layers);

    // calls return the same value while the layer doesn't exist
    expect(os.layer.getUniqueTitle(title)).toBe(title);
    expect(os.layer.getUniqueTitle(title)).toBe(title);

    var layer = new os.layer.MockLayer();
    layer.title = title;
    layers.push(layer);

    var nextTitle = os.layer.getUniqueTitle(title);
    expect(nextTitle).toBe(title + ' [1]');

    layer = new os.layer.MockLayer();
    layer.title = nextTitle;
    layers.push(layer);

    nextTitle = os.layer.getUniqueTitle(title);
    expect(nextTitle).toBe(title + ' [2]');

    layer = new os.layer.MockLayer();
    layer.title = nextTitle;
    layers.push(layer);

    expect(os.layer.getUniqueTitle(title)).toBe(title + ' [3]');

    // remove the [1] layer
    layers.splice(1);
    expect(os.layer.getUniqueTitle(title)).toBe(title + ' [1]');

    // remove all layers
    layers.length = 0;
    expect(os.layer.getUniqueTitle(title)).toBe(title);
  });
});
