goog.require('os.im.Importer');
goog.require('os.net.Request');
goog.require('goog.net.EventType');
goog.require('os.mock');
goog.require('ol.format.GeoJSON');
goog.require('plugin.file.geojson.GeoJSONParser');

describe('plugin.file.geojson.GeoJSONParser', function() {
  var gj1 = {
    'type': 'FeatureCollection',
    'features': [{
      'type': 'Feature',
      'geometry': {'type': 'Point', 'coordinates': [102.0, 0.5]},
      'properties': {'prop0': 'value0'}
    },
    42, {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [
          [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ]
      },
      'properties': {
        'prop0': 'value0',
        'prop1': 0.0
      }
    },{
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]]
      },
      'properties': {
        'prop0': 'value0',
        'prop1': {'this': 'that'}
      }
    }]
  };

  it('should handle object sources', function() {
    var p = new plugin.file.geojson.GeoJSONParser();
    p.setSource(gj1);

    expect(p.features_).not.toBe(null);
    expect(p.hasNext()).toBe(true);
  });

  it('should handle string sources', function() {
    var p = new plugin.file.geojson.GeoJSONParser();
    p.setSource('{"type": "Feature","geometry": {"type": "Point", "coordinates": [102.0, 0.5]}, "properties": ' +
        '{"prop0": "value0"}}');

    expect(p.features_).not.toBe(null);
    expect(p.hasNext()).toBe(true);
  });

  it('should parse an object', function() {
    var p = new plugin.file.geojson.GeoJSONParser();
    p.setSource(gj1);

    var step = p.parseNext();
    expect(step.length).toBe(1);
    expect(step[0]).not.toBe(null);

    // the next object is bogus and should throw an error
    var fn = function() {
      step = p.parseNext();
    };

    expect(fn).toThrow();

    // should be able to continue after the error
    step = p.parseNext();
    expect(step.length).toBe(1);
    expect(step[0]).not.toBe(null);
  });

  it('should work with an importer to parse large requests', function() {
    var r = new os.net.Request('/base/test/plugin/file/geojson/10k.json');
    var i = new os.im.Importer(new plugin.file.geojson.GeoJSONParser());
    var count = 0;
    var listener = function(e) {
      count++;
    };

    r.listen(goog.net.EventType.SUCCESS, listener);
    i.listen(os.events.EventType.COMPLETE, listener);

    runs(function() {
      r.load();
    });

    waitsFor(function() {
      return count == 1;
    }, 'request to finish loading');

    runs(function() {
      i.startImport(r.getResponse());
      r.clearResponse();
    });

    waitsFor(function() {
      return count == 2;
    }, 'importer to finish');

    runs(function() {
      var data = i.getData();
      expect(data.length).toBe(10000);
    });
  });
});
