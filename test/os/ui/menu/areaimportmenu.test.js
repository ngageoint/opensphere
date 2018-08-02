goog.require('os.query');
goog.require('os.ui.menu.areaImport');

describe('os.ui.menu.areaImport', function() {
  it('defaults to undefined', function() {
    expect(os.ui.menu.areaImport.MENU).toBeUndefined();
  });

  it('adds default options on setup', function() {
    os.ui.menu.areaImport.setup();

    var menu = os.ui.menu.areaImport.MENU;
    expect(menu).toBeDefined();
    expect(menu.getRoot()).toBeDefined();
    expect(menu.getRoot().find(os.ui.menu.areaImport.EventType.FILE)).toBeDefined();
    expect(menu.getRoot().find(os.ui.menu.areaImport.EventType.ENTER_COORDINATES)).toBeDefined();
    expect(menu.getRoot().find(os.ui.menu.areaImport.EventType.QUERY_WORLD)).toBeDefined();
  });

  it('handles menu events', function() {
    spyOn(os.query, 'launchQueryImport');
    os.ui.menu.areaImport.handleQueryEvent_({type: os.ui.menu.areaImport.EventType.FILE});
    expect(os.query.launchQueryImport).toHaveBeenCalled();

    spyOn(os.query, 'launchCoordinates');
    os.ui.menu.areaImport.handleQueryEvent_({type: os.ui.menu.areaImport.EventType.ENTER_COORDINATES});
    expect(os.query.launchCoordinates).toHaveBeenCalled();

    spyOn(os.query, 'queryWorld');
    os.ui.menu.areaImport.handleQueryEvent_({type: os.ui.menu.areaImport.EventType.QUERY_WORLD});
    expect(os.query.queryWorld).toHaveBeenCalled();
  });

  it('disposes the menu', function() {
    os.ui.menu.areaImport.dispose();
    expect(os.ui.menu.areaImport.MENU).toBeUndefined();
  });
});
