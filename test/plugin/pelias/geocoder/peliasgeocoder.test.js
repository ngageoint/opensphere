goog.require('os.MapContainer');
goog.require('os.config.Settings');
goog.require('os.mock');
goog.require('os.search.SearchEventType');
goog.require('plugin.pelias.geocoder.Plugin');
goog.require('plugin.pelias.geocoder.Result');
goog.require('plugin.pelias.geocoder.Search');

import Feature from 'ol/src/Feature.js';

describe('plugin.pelias.geocoder.Search', function() {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {default: SearchEventType} = goog.module.get('os.search.SearchEventType');
  const {default: Result} = goog.module.get('plugin.pelias.geocoder.Result');
  const {default: Search} = goog.module.get('plugin.pelias.geocoder.Search');

  var url = '/pelias.geocoder?text={s}';
  var boundary = '&boundary=true';

  it('should get a blank search url by default', function() {
    var search = new Search();
    expect(search.getSearchUrl()).toBeFalsy();
  });

  it('should get a defined search url', function() {
    var search = new Search();
    Settings.getInstance().set('plugin.pelias.geocoder.url', url);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary parameters if boundary not defined', function() {
    var search = new Search();
    // diagonal ~110km
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 1, 1]);

    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary if the view diagonal is not within the threshold', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    Settings.getInstance().set('plugin.pelias.geocoder.extentParams', boundary);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should add boundary if the view diagonal is within the threshold', function() {
    var search = new Search();
    // diagonal ~110km
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 1, 1]);

    expect(search.getSearchUrl())
        .toBe(url + '&boundary.rect.min_lat=0&boundary.rect.min_lon=0&boundary.rect.max_lat=1&boundary.rect.max_lon=1');
  });

  it('should add focus point if so configured', function() {
    var search = new Search();
    Settings.getInstance().set('plugin.pelias.geocoder.focusPoint', true);
    spyOn(MapContainer.getInstance().getMap().getView(), 'getCenter').andReturn([150.1, -35.2]);
    spyOn(MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(10.0);
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);

    expect(search.getSearchUrl()).toBe(url + '&focus.point.lat=-35.2&focus.point.lon=150.1');
  });

  it('should should not add focus point at low zoom levels', function() {
    var search = new Search();
    Settings.getInstance().set('plugin.pelias.geocoder.focusPoint', true);
    spyOn(MapContainer.getInstance().getMap().getView(), 'getCenter').andReturn([150.1, -35.2]);
    spyOn(MapContainer.getInstance().getMap().getView(), 'getZoom').andReturn(3.0);
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);

    expect(search.getSearchUrl()).toBe(url);
  });

  var loadAndRun = function(search, url, term, func) {
    Settings.getInstance().set('plugin.pelias.geocoder.url', url);
    var count = 0;
    var listener = function() {
      count++;
    };

    search.listenOnce(SearchEventType.SUCCESS, listener);

    waitsFor(function() {
      return count;
    });

    runs(func);
    search.searchTerm(term);
  };

  it('should handle malformed JSON in results', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/malformed.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle valid JSON without features', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/nofeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(0);
        });
  });

  it('should handle JSON with invalid features', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/badfeatures.json',
        'nope',
        function() {
          expect(search.results.length).toBe(1);

          search.results.forEach(function(item) {
            expect(item instanceof Result).toBeTruthy();
            expect(item.getResult() instanceof Feature).toBeTruthy();
          });
        });
  });

  it('should parse results', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/pelias-result.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof Result).toBeTruthy();
            expect(item.getResult() instanceof Feature).toBeTruthy();
          });

          expect(search.results.filter(function(item) {
            return !!item.getResult().get('extent');
          }).length).toBe(8);
        });
  });

  it('should parse results with addresses', function() {
    var search = new Search();
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    loadAndRun(
        search,
        '/base/test/plugin/pelias/geocoder/pelias-result2.json',
        'nope',
        function() {
          expect(search.results.length).toBe(10);

          search.results.forEach(function(item) {
            expect(item instanceof Result).toBeTruthy();
            expect(item.getResult() instanceof Feature).toBeTruthy();
          });

          expect(search.results[0].getResult().get('address')).toBe('4004 West 38th Avenue, Denver, CO, 80212');
        });
  });
});
