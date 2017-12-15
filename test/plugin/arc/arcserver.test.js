goog.require('os.ui.slick.LoadingNode');
goog.require('plugin.arc.ArcServer');


describe('plugin.arc.ArcServer', function() {
  it('should configure itself correctly', function() {
    var server = new plugin.arc.ArcServer();
    var config = {
      'label': 'Arc Test',
      'type': 'arc',
      'url': 'https://fake.server.com/arcgis/rest/services'
    };

    server.configure(config);
    expect(server.getLabel()).toBe('Arc Test');
    expect(server.getUrl()).toBe('https://fake.server.com/arcgis/rest/services');

    // configs with slightly off URLs
    server = new plugin.arc.ArcServer();
    var config2 = {
      'label': 'Arc Test 2',
      'type': 'arc',
      'url': 'https://fake.server.com/arcgis'
    };

    server.configure(config2);
    // it should add the /rest/services part
    expect(server.getUrl()).toBe('https://fake.server.com/arcgis/rest/services');

    server = new plugin.arc.ArcServer();
    var config3 = {
      'label': 'Arc Test 3',
      'type': 'arc',
      'url': 'https://fake.server.com/arcgis/rest/services/MapServer'
    };

    server.configure(config3);
    // it should keep the /MapServer
    expect(server.getUrl()).toBe('https://fake.server.com/arcgis/rest/services/MapServer');
  });
});
