goog.require('os.MapContainer');
goog.require('os.config.Settings');
goog.require('os.search.SearchEventType');
goog.require('plugin.google.places.Search');

describe('plugin.google.places.Search', function() {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {default: Search} = goog.module.get('plugin.google.places.Search');

  var url = '/google-places/text?text={s}';
  var nearby = '/google-places/nearby?keyword={s},location={pos:lat},{pos:lon}';

  it('should get a blank search url by default', function() {
    var search = new Search();
    expect(search.getSearchUrl()).toBeFalsy();
  });

  it('should get a defined search url', function() {
    var search = new Search();
    Settings.getInstance().set('plugin.google.places.url', url);
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
    Settings.getInstance().set('plugin.google.places.nearby', nearby);
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 45, 45]);
    expect(search.getSearchUrl()).toBe(url);
  });

  it('should add boundary if the view diagonal is within the threshold', function() {
    var search = new Search();

    // diagonal ~110km
    spyOn(MapContainer.getInstance().getMap(), 'getExtent').andReturn([0, 0, 1, 1]);

    expect(search.getSearchUrl()).toBe(nearby);
  });
});
