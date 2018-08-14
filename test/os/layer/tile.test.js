goog.require('os.layer.Tile');
goog.require('os.mock');
goog.require('ol.source.TileWMS');
goog.require('plugin.ogc.wms.TileWMSSource');


describe('os.layer.Tile', function() {
  var layer;

  it('initializes the layer', function() {
    layer = new os.layer.Tile({
      source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
        params: { 'LAYERS': 'dontcare' }
      }))
    });
  });

  it('should initialize properly', function() {
    expect(layer.getOSType()).toBe('Tile Layers');
  });

  it('should fire a change event when loading state changes', function() {
    var calls = 0;
    var loadListener = function(event) {
      expect(event.getProperty()).toBe('loading');
      calls++;
    };

    runs(function() {
      ol.events.listen(layer, goog.events.EventType.PROPERTYCHANGE, loadListener);
      expect(layer.isLoading()).toBe(false);

      // make sure setting to the same value doesn't fire a change event
      layer.setLoading(false);
      expect(layer.isLoading()).toBe(false);

      layer.setLoading(true);
      expect(layer.isLoading()).toBe(true);
    });

    waitsFor(function() {
      return calls === 1;
    }, 'call count to increment');

    runs(function() {
      expect(calls).toEqual(1);
      expect(layer.isLoading()).toBe(true);

      // make sure setting to the same value doesn't fire a change event
      layer.setLoading(true);
      expect(layer.isLoading()).toBe(true);

      layer.setLoading(false);
      expect(layer.isLoading()).toBe(false);
    });

    waitsFor(function() {
      return calls === 2;
    }, 'call count to increment');

    runs(function() {
      expect(calls).toEqual(2);
      expect(layer.isLoading()).toBe(false);

      ol.events.unlisten(layer, goog.events.EventType.PROPERTYCHANGE, loadListener);
    });
  });

  var styles = [
    {
      label: 'Default',
      data: ''
    },
    {
      label: 'Heatmap',
      data: 'heatmap2px'
    },
    {
      label: 'Heatmap Hue',
      data: 'heatmaphue'
    }
  ];

  it('should restore properly', function() {
    var layer = new os.layer.Tile({
      source: new plugin.ogc.wms.TileWMSSource(/** @type {olx.source.TileWMSOptions} */ ({
        params: { 'LAYERS': 'dontcare' }
      }))
    });

    var config = {
      'id': 'myId',
      'provider': 'someServer',
      'tags': 'U, S, A',
      'title': 'myLayer',
      'layerType': 'tile',
      'visible': true,
      'alpha': 0.6,
      'brightness': 0.8,
      'contrast': 0.5,
      'saturation': 1.5,
      'style': 'heatmap2px'
    };

    layer.setStyles(styles);
    layer.restore(config);
    expect(layer.getId()).toBe('myId');
    expect(layer.getProvider()).toBe('someServer');
    expect(layer.getTags()).toBe('U, S, A');
    expect(layer.getTitle()).toBe('myLayer');
    expect(layer.getOSType()).toBe('tile');
    expect(layer.getOpacity()).toBe(0.6);
    // expect(layer.getBrightness()).toBe(0.8);
    // expect(layer.getContrast()).toBe(0.5);
    // expect(layer.getSaturation()).toBe(1.5);
    expect(layer.getStyle().label).toBe('Heatmap');
    expect(layer.getStyle().data).toBe('heatmap2px');
  });
});
