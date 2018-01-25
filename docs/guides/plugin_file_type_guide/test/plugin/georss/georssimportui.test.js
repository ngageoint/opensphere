goog.require('os.file');
goog.require('plugin.georss.GeoRSSImportUI');

describe('plugin.georss.GeoRSSImportUI', function() {
  it('should have the proper title', function() {
    var importui = new plugin.georss.GeoRSSImportUI();
    expect(importui.getTitle()).toBe('GeoRSS');
  });

  it('should launch an import UI with an empty config', function() {
    var importui = new plugin.georss.GeoRSSImportUI();
    var file = os.file.createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    spyOn(os.ui.window, 'create');
    importui.launchUI(file, {});
    expect(os.ui.window.create).toHaveBeenCalled();
  });

  it('should launch an import UI with a null config', function() {
    var importui = new plugin.georss.GeoRSSImportUI();
    var file = os.file.createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    spyOn(os.ui.window, 'create');
    importui.launchUI(file, undefined);
    expect(os.ui.window.create).toHaveBeenCalled();
  });

  it('should launch an import UI with a config', function() {
    var importui = new plugin.georss.GeoRSSImportUI();
    var file = os.file.createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    spyOn(os.ui.window, 'create');
    importui.launchUI(file, {'title': 'other'});
    expect(os.ui.window.create).toHaveBeenCalled();
  });
});
