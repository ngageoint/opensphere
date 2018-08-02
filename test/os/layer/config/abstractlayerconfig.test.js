goog.require('ol.source.XYZ');
goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');
goog.require('os.net');
goog.require('os.source.MockSource');

describe('os.layer.config.AbstractLayerConfig', function() {
  it('has a default size option', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.size).toBe(3);
  });

  it('handles the size option', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = { 'size' : 4 };
    lc.initializeConfig(options);
    expect(lc.size).toBe(4);
  });

  it('is visible by default', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.visible).toBe(true);
  });

  it('handles the visible option for false', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = { 'visible': false };
    lc.initializeConfig(options);
    expect(lc.visible).toBe(false);
  });

  it('handles the visible option for true', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = { 'visible': true };
    lc.initializeConfig(options);
    expect(lc.visible).toBe(true);
  });

  it('is does not colorize by default', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(false);
  });

  it('handles the colorize option for true', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = { 'colorize': true };
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(true);
  });

  it('handles the colorize option for false', function() {
    var lc = new os.layer.config.AbstractLayerConfig();
    var options = { 'colorize': false };
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(false);
  });
});
