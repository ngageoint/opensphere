goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('plugin.osm.nom.NominatimParser');

import Feature from 'ol/src/Feature.js';

describe('plugin.osm.nom.NominatimParser', function() {
  const EventType = goog.module.get('goog.net.EventType');
  const XhrIo = goog.module.get('goog.net.XhrIo');
  const {default: NominatimParser} = goog.module.get('plugin.osm.nom.NominatimParser');

  var parser = new NominatimParser();
  var response;

  var loadResponse = function() {
    if (!response) {
      var xhr = new XhrIo();
      xhr.listen(EventType.SUCCESS, function() {
        response = xhr.getResponse();
      }, false);

      runs(function() {
        xhr.send('/base/test/plugin/osm/nom/nominatim_response.json');
      });

      waitsFor(function() {
        return response;
      }, 'test data to load');
    }
  };

  beforeEach(loadResponse);

  it('initializes data from an OSM Nomintim response', function() {
    parser.setSource(response);

    expect(parser.results.length).toBe(8);
    expect(parser.nextIndex).toBe(0);
    expect(parser.hasNext()).toBe(true);
  });

  it('parses response data from OSM Nominatim', function() {
    var numResults = 0;
    var next;

    while (parser.hasNext()) {
      next = parser.parseNext();
      expect(next).toBeDefined();
      expect(next instanceof Feature).toBe(true);
      expect(next.getGeometry()).toBeDefined();

      numResults++;
    }

    expect(parser.hasNext()).toBe(false);
    expect(numResults).toBe(8);
  });

  it('cleans up', function() {
    parser.cleanup();

    expect(parser.results).toBeUndefined();
    expect(parser.nextIndex).toBe(0);
    expect(parser.hasNext()).toBe(false);
  });
});
