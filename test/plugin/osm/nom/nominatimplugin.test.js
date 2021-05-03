goog.require('os.config.Settings');
goog.require('os.search.SearchManager');
goog.require('plugin.osm.nom');
goog.require('plugin.osm.nom.NominatimPlugin');
goog.require('plugin.osm.nom.NominatimSearch');

describe('plugin.osm.nom.NominatimPlugin', function() {
  const Settings = goog.module.get('os.config.Settings');
  const SearchManager = goog.module.get('os.search.SearchManager');
  const nom = goog.module.get('plugin.osm.nom');
  const NominatimPlugin = goog.module.get('plugin.osm.nom.NominatimPlugin');
  const NominatimSearch = goog.module.get('plugin.osm.nom.NominatimSearch');

  it('should initialize properly', function() {
    var nomPlugin = new NominatimPlugin();
    expect(nomPlugin.getId()).toBe(nom.ID);

    // replace the global search manager with our own
    var sm = new SearchManager();
    spyOn(SearchManager, 'getInstance').andReturn(sm);

    // search does not exist prior to initialization
    var search = sm.getSearch(nom.ID);
    expect(search).toBeNull();

    // remove url from settings
    Settings.getInstance().set(nom.SettingKey.URL, undefined);

    // initialize the plugin
    nomPlugin.init();

    // search was not added without setting
    search = sm.getSearch(nom.ID);
    expect(search).toBeNull();

    // add url to settings
    Settings.getInstance().set(nom.SettingKey.URL, 'http://fake.url/');

    // initialize the plugin
    nomPlugin.init();

    // search should be registered
    search = sm.getSearch(nom.ID);
    expect(search).toBeDefined();
    expect(search instanceof NominatimSearch).toBe(true);
    expect(search.name).toBe(nom.SEARCH_NAME);
  });
});
