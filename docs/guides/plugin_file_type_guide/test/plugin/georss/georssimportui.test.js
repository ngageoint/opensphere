goog.require('os.file');
goog.require('plugin.georss.GeoRSSImportUI');

describe('plugin.georss.GeoRSSImportUI', function() {
  const {createFromContent} = goog.module.get('os.file');
  const {default: GeoRSSImportUI} = goog.module.get('plugin.georss.GeoRSSImportUI');

  const formSelector = 'form[name="georssForm"]';

  it('should have the proper title', function() {
    var importui = new GeoRSSImportUI();
    expect(importui.getTitle()).toBe('GeoRSS');
  });

  it('should launch an import UI with an empty config', function() {
    var importui = new GeoRSSImportUI();
    var file = createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    spyOn(os.ui.window, 'create');
    importui.launchUI(file, {});
    expect(os.ui.window.create).toHaveBeenCalled();
  });

  it('should launch an import UI with a null config', function() {
    var importui = new GeoRSSImportUI();
    var file = createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    importui.launchUI(file, undefined);

    waitsFor(() => !!document.querySelector(formSelector), 'import ui to open');

    runs(() => {
      const formEl = document.querySelector(formSelector);
      const scope = $(formEl).scope();
      expect(scope).toBeDefined();
      expect(scope.georssImport).toBeDefined();

      scope.georssImport.cancel();
    });

    waitsFor(() => !document.querySelector(formSelector), 'import ui to close');
  });

  it('should launch an import UI with a config', function() {
    var importui = new GeoRSSImportUI();
    var file = createFromContent('testname.rss', 'http://www.example.com/testname.rss', undefined, '<?xml version="1.0" encoding="utf-8"?><feed/>');
    importui.launchUI(file, {'title': 'other'});

    waitsFor(() => !!document.querySelector(formSelector), 'import ui to open');

    runs(() => {
      const formEl = document.querySelector(formSelector);
      const scope = $(formEl).scope();
      expect(scope).toBeDefined();
      expect(scope.georssImport).toBeDefined();

      scope.georssImport.cancel();
    });

    waitsFor(() => !document.querySelector(formSelector), 'import ui to close');
  });
});
