goog.require('os.mock');
goog.require('os.search.SearchEventType');
goog.require('plugin.mapzen.places.Plugin');
goog.require('plugin.mapzen.places.Search');

describe('plugin.mapzen.places.Search', function() {
  var url = '/mapzen-places?text={s}';
  var boundary = '&boundary=true';

  it('should get a blank search url by default', function() {
    var search = new plugin.mapzen.places.Search();
    expect(search.getSearchUrl()).toBeFalsy();
  });

  it('should get a defined search url', function() {
    var search = new plugin.mapzen.places.Search();
    os.settings.set('plugin.mapzen.places.url', url);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary parameters if boundary not defined', function() {
    var search = new plugin.mapzen.places.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary if the view diagonal is not within the threshold', function() {
    var search = new plugin.mapzen.places.Search();
    os.settings.set('plugin.mapzen.places.extentParams', boundary);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should add boundary if the view diagonal is within the threshold', function() {
    var search = new plugin.mapzen.places.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(url + '&boundary.rect.min_lat=0&boundary.rect.min_lon=0&boundary.rect.max_lat=1&boundary.rect.max_lon=1');
  });

  it('should add focus point if so configured', function() {
    var search = new plugin.mapzen.places.Search();
    os.settings.set('plugin.mapzen.places.focusPoint', true);
    spyOn(ol.proj, 'toLonLat').andReturn([150.1, -35.2]);
    spyOn(os.MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(10.0);

    expect(search.getSearchUrl()).toBe(url + '&focus.point.lat=-35.2&focus.point.lon=150.1');
  });

  it('should should not add focus point at low zoom levels', function() {
    var search = new plugin.mapzen.places.Search();
    os.settings.set('plugin.mapzen.places.focusPoint', true);
    spyOn(ol.proj, 'toLonLat').andReturn([150.1, -35.2]);
    spyOn(os.MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(3.0);

    expect(search.getSearchUrl()).toBe(url);
  });

  var loadAndRun = function(search, url, term, func) {
    os.settings.set('plugin.mapzen.places.url', url);
    var count = 0;
    var listener = function() {
      count++;
    };

    search.listenOnce(os.search.SearchEventType.SUCCESS, listener);

    waitsFor(function() {
      return count;
    });

    runs(func);
    search.searchTerm(term);
  };

  it('should handle malformed JSON in results', function() {
    var search = new plugin.mapzen.places.Search();
    loadAndRun(
        search,
        '/base/test/plugin/mapzen/places/malformed.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle valid JSON without features', function() {
    var search = new plugin.mapzen.places.Search();
    loadAndRun(
        search,
        '/base/test/plugin/mapzen/places/nofeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle JSON with invalid features', function() {
    var search = new plugin.mapzen.places.Search();
    loadAndRun(
        search,
        '/base/test/plugin/mapzen/places/badfeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(1);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.mapzen.places.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });
        });
  });

  it('should parse results', function() {
    var search = new plugin.mapzen.places.Search();
    loadAndRun(
        search,
        '/base/test/plugin/mapzen/places/mapzen-result.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.mapzen.places.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });

          expect(search.results.filter(function(item) {
            return !!item.getResult().get('extent');
          }).length).toBe(8);
        });
  });

  it('should parse results with addresses', function() {
    var search = new plugin.mapzen.places.Search();
    loadAndRun(
        search,
        '/base/test/plugin/mapzen/places/mapzen-result2.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.mapzen.places.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });

          expect(search.results[0].getResult().get('address')).toBe('4004 West 38th Avenue, Denver, CO, 80212');
        });
  });
});

