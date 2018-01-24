// os.mock sets up a bunch of basic opensphere APIs, like settings, which is
// used in our example plugin
goog.require('os.mock');
goog.require('plugin.tileserver.TileserverPlugin');

describe('plugin.tileserver.TileserverPlugin', function() {
  it('should have the proper ID', function() {
    expect(new plugin.tileserver.TileserverPlugin().id).toBe('tileserver');
  });

  it('should not throw an error', function() {
    var fn = function() {
      var p = new plugin.tileserver.TileserverPlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });
});
