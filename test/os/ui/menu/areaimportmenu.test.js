goog.require('os.query');
goog.require('os.ui.menu.areaImport');

describe('os.ui.menu.areaImport', function() {
  const query = goog.module.get('os.query');
  const areaImport = goog.module.get('os.ui.menu.areaImport');

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

  it('handles menu events', function() {
    spyOn(query, 'launchQueryImport');
    areaImport.handleQueryEvent_({type: areaImport.EventType.FILE});
    expect(query.launchQueryImport).toHaveBeenCalled();

    spyOn(query, 'launchCoordinates');
    areaImport.handleQueryEvent_({type: areaImport.EventType.ENTER_COORDINATES});
    expect(query.launchCoordinates).toHaveBeenCalled();

    spyOn(query, 'queryWorld');
    areaImport.handleQueryEvent_({type: areaImport.EventType.QUERY_WORLD});
    expect(query.queryWorld).toHaveBeenCalled();
  });

  it('disposes the menu', function() {
    areaImport.dispose();
    expect(areaImport.getMenu()).toBeUndefined();
  });
});
