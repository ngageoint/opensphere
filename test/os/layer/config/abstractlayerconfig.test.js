goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.mock');

describe('os.layer.config.AbstractLayerConfig', function() {
  const {default: AbstractLayerConfig} = goog.module.get('os.layer.config.AbstractLayerConfig');

  it('has a default size option', function() {
    var lc = new AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.size).toBe(3);
  });

  it('handles the size option', function() {
    var lc = new AbstractLayerConfig();
    var options = {'size': 4};
    lc.initializeConfig(options);
    expect(lc.size).toBe(4);
  });

  it('is visible by default', function() {
    var lc = new AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.visible).toBe(true);
  });

  it('handles the visible option for false', function() {
    var lc = new AbstractLayerConfig();
    var options = {'visible': false};
    lc.initializeConfig(options);
    expect(lc.visible).toBe(false);
  });

  it('handles the visible option for true', function() {
    var lc = new AbstractLayerConfig();
    var options = {'visible': true};
    lc.initializeConfig(options);
    expect(lc.visible).toBe(true);
  });

  it('is does not colorize by default', function() {
    var lc = new AbstractLayerConfig();
    var options = {};
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(false);
  });

  it('handles the colorize option for true', function() {
    var lc = new AbstractLayerConfig();
    var options = {'colorize': true};
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(true);
  });

  it('handles the colorize option for false', function() {
    var lc = new AbstractLayerConfig();
    var options = {'colorize': false};
    lc.initializeConfig(options);
    expect(lc.colorize).toBe(false);
  });
});
