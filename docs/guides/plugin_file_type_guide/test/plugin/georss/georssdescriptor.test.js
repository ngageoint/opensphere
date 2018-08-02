goog.require('os.file.File');
goog.require('os.parse.FileParserConfig');
goog.require('plugin.georss.GeoRSSDescriptor');

describe('plugin.georss.GeoRSSDescriptor', function() {
  it('should report the correct type', function() {
    var d = new plugin.georss.GeoRSSDescriptor();
    expect(d.getType()).toBe(os.layer.LayerType.FEATURES);
  });

  it('should produce the correct layer options', function() {
    var d = new plugin.georss.GeoRSSDescriptor();
    var opts = d.getLayerOptions();
    expect(opts.type).toBe(plugin.georss.ID);
    expect(opts[os.ui.ControlType.COLOR]).toBe(os.ui.ColorControlType.PICKER_RESET);
  });

  it('should create a descriptor from a file parser config', function() {
    var file = new os.file.File();
    file.setUrl('http://localhost/doesnotexist.georss');

    // default config
    var config = new os.parse.FileParserConfig(file);
    var d = plugin.georss.GeoRSSDescriptor.createFromConfig(config);

    expect(d.getId()).toBeTruthy();
    expect(d.getProvider()).toBe(plugin.georss.GeoRSSProvider.getInstance().getLabel());
    expect(d.getUrl()).toBe(file.getUrl());
    expect(d.getColor()).toBeTruthy();

    // edited config
    var config = new os.parse.FileParserConfig(file);
    config['tags'] = 'one, two\t, three';

    d = plugin.georss.GeoRSSDescriptor.createFromConfig(config);
    expect(d.getId()).toBeTruthy();
    expect(d.getProvider()).toBe(plugin.georss.GeoRSSProvider.getInstance().getLabel());
    expect(d.getUrl()).toBe(file.getUrl());
    expect(d.getColor()).toBeTruthy();
    expect(d.getTags()).toContain('one');
    expect(d.getTags()).toContain('two');
    expect(d.getTags()).toContain('three');
  });
});
