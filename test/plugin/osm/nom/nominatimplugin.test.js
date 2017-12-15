goog.require('os.search.SearchManager');
goog.require('plugin.osm.nom');
goog.require('plugin.osm.nom.NominatimPlugin');
goog.require('plugin.osm.nom.NominatimSearch');

describe('plugin.osm.nom.NominatimPlugin', function() {
  it('should initialize properly', function() {
    var nomPlugin = new plugin.osm.nom.NominatimPlugin();
    expect(nomPlugin.getId()).toBe(plugin.osm.nom.ID);

    // replace the global search manager with our own
    var sm = new os.search.SearchManager();
    spyOn(os.search.SearchManager, 'getInstance').andReturn(sm);

    // search does not exist prior to initialization
    var search = sm.getSearch(plugin.osm.nom.ID);
    expect(search).toBeNull();

    // remove url from settings
    os.settings.set(plugin.osm.nom.SettingKey.URL, undefined);

    // initialize the plugin
    nomPlugin.init();

    // search was not added without setting
    search = sm.getSearch(plugin.osm.nom.ID);
    expect(search).toBeNull();

    // add url to settings
    os.settings.set(plugin.osm.nom.SettingKey.URL, 'http://fake.url/');

    // initialize the plugin
    nomPlugin.init();

    // search should be registered
    search = sm.getSearch(plugin.osm.nom.ID);
    expect(search).toBeDefined();
    expect(search instanceof plugin.osm.nom.NominatimSearch).toBe(true);
    expect(search.name).toBe(plugin.osm.nom.SEARCH_NAME);
  });
});
