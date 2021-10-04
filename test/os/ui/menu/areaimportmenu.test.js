goog.require('os.query.instance');
goog.require('os.query.utils');
goog.require('os.ui.im.ImportProcess');
goog.require('os.ui.menu.areaImport');

describe('os.ui.menu.areaImport', function() {
  const {getAreaManager} = goog.module.get('os.query.instance');
  const {WORLD_AREA} = goog.module.get('os.query.utils');
  const {default: ImportProcess} = goog.module.get('os.ui.im.ImportProcess');
  const areaImport = goog.module.get('os.ui.menu.areaImport');

  const enterAreaSelector = 'div[label="Enter Area Coordinates"]';

  it('defaults to undefined', function() {
    expect(areaImport.getMenu()).toBeUndefined();
  });

  it('adds default options on setup', function() {
    areaImport.setup();

    var menu = areaImport.getMenu();
    expect(menu).toBeDefined();
    expect(menu.getRoot()).toBeDefined();
    expect(menu.getRoot().find(areaImport.EventType.FILE)).toBeDefined();
    expect(menu.getRoot().find(areaImport.EventType.ENTER_COORDINATES)).toBeDefined();
    expect(menu.getRoot().find(areaImport.EventType.QUERY_WORLD)).toBeDefined();
  });

  it('handles import file/url menu events', function() {
    spyOn(ImportProcess.prototype, 'begin');
    areaImport.handleQueryEvent({type: areaImport.EventType.FILE});
    expect(ImportProcess.prototype.begin).toHaveBeenCalled();
  });

  it('handles enter coordinate menu events', function() {
    areaImport.handleQueryEvent({type: areaImport.EventType.ENTER_COORDINATES});

    waitsFor(() => !!document.querySelector(enterAreaSelector), 'enter coordinates window to open');

    runs(() => {
      const bodyEl = document.querySelector(`${enterAreaSelector} .modal-body`);
      const scope = $(bodyEl).scope();
      expect(scope).toBeDefined();
      expect(scope.ctrl).toBeDefined();

      scope.ctrl.cancel();
    });

    waitsFor(() => !document.querySelector(enterAreaSelector), 'enter coordinates window to close');
  });

  it('handles enter coordinate menu events', function() {
    const am = getAreaManager();
    am.clear();

    areaImport.handleQueryEvent({type: areaImport.EventType.QUERY_WORLD});

    const areas = am.getAll();
    expect(areas.length).toBe(1);
    expect(areas[0].get('title')).toBe(WORLD_AREA.get('title'));

    am.clear();
  });

  it('disposes the menu', function() {
    areaImport.dispose();
    expect(areaImport.getMenu()).toBeUndefined();
  });
});
