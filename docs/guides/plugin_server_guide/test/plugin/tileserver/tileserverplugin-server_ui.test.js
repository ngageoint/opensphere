goog.require('os.file');
goog.require('os.file.File');
// os.mock sets up a bunch of basic opensphere APIs, like settings, which is
// used in our example plugin
goog.require('os.mock');
goog.require('plugin.tileserver.TileserverPlugin');

describe('plugin.tileserver.TileserverPlugin', function() {
  const {getLocalUrl} = goog.module.get('os.file');
  const {default: OSFile} = goog.module.get('os.file.File');
  const {isTileServerResponse} = goog.module.get('plugin.tileserver');
  const {default: TileserverPlugin} = goog.module.get('plugin.tileserver.TileserverPlugin');

  it('should have the proper ID', function() {
    expect(new TileserverPlugin().id).toBe('tileserver');
  });

  it('should not throw an error', function() {
    var fn = function() {
      var p = new TileserverPlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });

  it('should detect tileserver responses', function() {
    var file = new OSFile();
    file.setUrl('http://something/index.json');
    file.setContent('  [{"format":"png","tilejson":"2.0.0"}] ');

    expect(isTileServerResponse(file)).toBe(3);
  });

  it('should not detect non-tileserver responses', function() {
    // no file
    var fn = isTileServerResponse;
    expect(fn()).toBe(0);

    // local file
    var file = new OSFile();
    file.setUrl(getLocalUrl('somefile.whatever'));
    expect(fn(file)).toBe(0);

    // no content
    file.setUrl('http://something.com/index.json');
    expect(fn(file)).toBe(0);

    // does not match
    file.setContent('this is not the droid you\'re looking for');
    expect(fn(file)).toBe(0);
  });
});
