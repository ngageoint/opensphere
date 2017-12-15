goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('plugin.osm.nom.NominatimParser');

describe('plugin.osm.nom.NominatimParser', function() {
  var parser = new plugin.osm.nom.NominatimParser();
  var response;

  var loadResponse = function() {
    if (!response) {
      var xhr = new goog.net.XhrIo();
      xhr.listen(goog.net.EventType.SUCCESS, function() {
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
      expect(next instanceof ol.Feature).toBe(true);
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
