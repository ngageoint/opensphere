goog.require('os.search.SearchEventType');
goog.require('plugin.google.places.Plugin');
goog.require('plugin.google.places.Search');

describe('plugin.google.places.Search', function() {
  var url = '/google-places/text?text={s}';
  var nearby = '/google-places/nearby?keyword={s},location={pos:lat},{pos:lon}';

  it('should get a blank search url by default', function() {
    var search = new plugin.google.places.Search();
    expect(search.getSearchUrl()).toBeFalsy();
  });

  it('should get a defined search url', function() {
    var search = new plugin.google.places.Search();
    os.settings.set('plugin.google.places.url', url);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary parameters if boundary not defined', function() {
    var search = new plugin.google.places.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(url);
  });

  it('should not add boundary if the view diagonal is not within the threshold', function() {
    var search = new plugin.google.places.Search();
    os.settings.set('plugin.google.places.nearby', nearby);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should add boundary if the view diagonal is within the threshold', function() {
    var search = new plugin.google.places.Search();
    spyOn(os.MapContainer.getInstance().getMap(), 'getExtent').andReturn(
      [0, 0, 1, 1] // diagonal ~110km
    );

    expect(search.getSearchUrl()).toBe(nearby);
  });
});
