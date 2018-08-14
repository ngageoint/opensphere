goog.require('os.mock');
goog.require('os.search.SearchEventType');
goog.require('plugin.pelias.geocoder.Plugin');
goog.require('plugin.pelias.geocoder.Search');

describe('plugin.pelias.geocoder.Search', function() {
  var url = '/pelias.geocoder?text={s}';
  var boundary = '&boundary=true';

  it('should get a blank search url by default', function() {
    var search = new plugin.pelias.geocoder.Search();
    expect(search.getSearchUrl()).toBeFalsy();
  });

  it('should get a defined search url', function() {
    var search = new plugin.pelias.geocoder.Search();
    os.settings.set('plugin.pelias.geocoder.url', url);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary parameters if boundary not defined', function() {
    var search = new plugin.pelias.geocoder.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary if the view diagonal is not within the threshold', function() {
    var search = new plugin.pelias.geocoder.Search();
    os.settings.set('plugin.pelias.geocoder.extentParams', boundary);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should add boundary if the view diagonal is within the threshold', function() {
    var search = new plugin.pelias.geocoder.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(url + '&boundary.rect.min_lat=0&boundary.rect.min_lon=0&boundary.rect.max_lat=1&boundary.rect.max_lon=1');
  });

  it('should add focus point if so configured', function() {
    var search = new plugin.pelias.geocoder.Search();
    os.settings.set('plugin.pelias.geocoder.focusPoint', true);
    spyOn(ol.proj, 'toLonLat').andReturn([150.1, -35.2]);
    spyOn(os.MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(10.0);

    expect(search.getSearchUrl()).toBe(url + '&focus.point.lat=-35.2&focus.point.lon=150.1');
  });

  it('should should not add focus point at low zoom levels', function() {
    var search = new plugin.pelias.geocoder.Search();
    os.settings.set('plugin.pelias.geocoder.focusPoint', true);
    spyOn(ol.proj, 'toLonLat').andReturn([150.1, -35.2]);
    spyOn(os.MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(3.0);

    expect(search.getSearchUrl()).toBe(url);
  });

  var loadAndRun = function(search, url, term, func) {
    os.settings.set('plugin.pelias.geocoder.url', url);
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
    var search = new plugin.pelias.geocoder.Search();
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/malformed.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle valid JSON without features', function() {
    var search = new plugin.pelias.geocoder.Search();
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/nofeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle JSON with invalid features', function() {
    var search = new plugin.pelias.geocoder.Search();
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/badfeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(1);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.pelias.geocoder.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });
        });
  });

  it('should parse results', function() {
    var search = new plugin.pelias.geocoder.Search();
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/pelias-result.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.pelias.geocoder.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });

          expect(search.results.filter(function(item) {
            return !!item.getResult().get('extent');
          }).length).toBe(8);
        });
  });

  it('should parse results with addresses', function() {
    var search = new plugin.pelias.geocoder.Search();
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/pelias-result2.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof plugin.pelias.geocoder.Result).toBeTruthy();
            expect(item.getResult() instanceof ol.Feature).toBeTruthy();
          });

          expect(search.results[0].getResult().get('address')).toBe('4004 West 38th Avenue, Denver, CO, 80212');
        });
  });

  it('should normalise longitudes greater than 180.0', function() {
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([190.2, 20.3, 230.4, 40.1])[0]).toBeCloseTo([-169.8, 20.3, -129.6, 40.1][0]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([190.2, 20.3, 230.4, 40.1])[1]).toBeCloseTo([-169.8, 20.3, -129.6, 40.1][1]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([190.2, 20.3, 230.4, 40.1])[2]).toBeCloseTo([-169.8, 20.3, -129.6, 40.1][2]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([190.2, 20.3, 230.4, 40.1])[3]).toBeCloseTo([-169.8, 20.3, -129.6, 40.1][3]);
  });

  it('should normalise longitudes less than -180.0', function() {
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([-230.4, 20.3, -190.2, 40.1])[0]).toBeCloseTo([129.6, 20.3, 169.8, 40.1][0]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([-230.4, 20.3, -190.2, 40.1])[1]).toBeCloseTo([129.6, 20.3, 169.8, 40.1][1]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([-230.4, 20.3, -190.2, 40.1])[2]).toBeCloseTo([129.6, 20.3, 169.8, 40.1][2]);
    expect(plugin.pelias.geocoder.Search.normaliseLongitudeExtent_([-230.4, 20.3, -190.2, 40.1])[3]).toBeCloseTo([129.6, 20.3, 169.8, 40.1][3]);
  });

});

