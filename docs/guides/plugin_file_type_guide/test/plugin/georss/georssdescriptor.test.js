goog.require('os.file.File');
goog.require('os.layer.LayerType');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.ColorControlType');
goog.require('os.ui.ControlType');
goog.require('plugin.georss');
goog.require('plugin.georss.GeoRSSDescriptor');
goog.require('plugin.georss.GeoRSSProvider');

describe('plugin.georss.GeoRSSDescriptor', function() {
  const {default: OSFile} = goog.module.get('os.file.File');
  const {default: LayerType} = goog.module.get('os.layer.LayerType');
  const {default: ColorControlType} = goog.module.get('os.ui.ColorControlType');
  const {default: ControlType} = goog.module.get('os.ui.ControlType');
  const {default: FileParserConfig} = goog.module.get('os.parse.FileParserConfig');

  const {ID} = goog.module.get('plugin.georss');
  const {default: GeoRSSDescriptor, createFromConfig} = goog.module.get('plugin.georss.GeoRSSDescriptor');
  const {default: GeoRSSProvider} = goog.module.get('plugin.georss.GeoRSSProvider');

  it('should report the correct type', function() {
    var d = new GeoRSSDescriptor();
    expect(d.getType()).toBe(LayerType.FEATURES);
  });

  it('should produce the correct layer options', function() {
    var d = new GeoRSSDescriptor();
    var opts = d.getLayerOptions();
    expect(opts.type).toBe(ID);
    expect(opts[ControlType.COLOR]).toBe(ColorControlType.PICKER_RESET);
  });

  it('should create a descriptor from a file parser config', function() {
    var file = new OSFile();
    file.setUrl('http://localhost/doesnotexist.georss');

    // default config
    var config = new FileParserConfig(file);
    var d = createFromConfig(config);

    expect(d.getId()).toBeTruthy();
    expect(d.getProvider()).toBe(GeoRSSProvider.getInstance().getLabel());
    expect(d.getUrl()).toBe(file.getUrl());
    expect(d.getColor()).toBeTruthy();

    // edited config
    var config = new FileParserConfig(file);
    config['tags'] = 'one, two\t, three';

    d = createFromConfig(config);
    expect(d.getId()).toBeTruthy();
    expect(d.getProvider()).toBe(GeoRSSProvider.getInstance().getLabel());
    expect(d.getUrl()).toBe(file.getUrl());
    expect(d.getColor()).toBeTruthy();
    expect(d.getTags()).toContain('one');
    expect(d.getTags()).toContain('two');
    expect(d.getTags()).toContain('three');
  });
});
