// os.mock sets up a bunch of basic opensphere APIs, like settings, which is
// used in our example plugin
goog.require('os.mock');
goog.require('plugin.tileserver.TileserverPlugin');

describe('plugin.tileserver.TileserverPlugin', function() {
  const {default: TileserverPlugin} = goog.module.get('plugin.tileserver.TileserverPlugin');

  it('should have the proper ID', function() {
    expect(new TileserverPlugin().id).toBe('tileserver');
  });

  it('should not throw an error', function() {
    const fn = function() {
      const p = new TileserverPlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });
});
