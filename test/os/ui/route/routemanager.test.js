goog.require('goog.object');
goog.require('os.file.FileUrlHandler');
goog.require('os.mock');
goog.require('os.ui');
goog.require('os.ui.route.RouteManager');


describe('os.ui.route.RouteManager', function() {
  const googObject = goog.module.get('goog.object');
  const {default: FileUrlHandler} = goog.module.get('os.file.FileUrlHandler');
  const ui = goog.module.get('os.ui');
  const {default: RouteManager} = goog.module.get('os.ui.route.RouteManager');

  let rm;
  let handler;

  beforeEach(function() {
    inject(function($injector) {
      ui.setInjector($injector);
    });

    rm = new RouteManager();
    handler = new FileUrlHandler();
  });

  it('should register URL handlers', function() {
    rm.registerUrlHandler(handler);

    expect(googObject.getCount(rm.routeHandlers_)).toBe(1);
    expect(rm.routeHandlers_[FileUrlHandler.KEY]).not.toBe(null);
    expect(rm.routeHandlers_[FileUrlHandler.KEY].length).toBe(1);
    expect(rm.routeHandlers_[FileUrlHandler.KEY][0]).toBe(handler);
  });

  it('should do nothing until its initialized', function() {
    rm.registerUrlHandler(handler);
    spyOn(rm, 'getSearch').andCallFake(function() {
      return {'file': 'https://fake.com/#/?file=file.csv'};
    });
    spyOn(handler, 'handle');

    rm.onRouteUpdate();
    expect(handler.handle).not.toHaveBeenCalled();

    rm.initialize();
    expect(handler.handle).toHaveBeenCalled();
  });

  it('should unhandle handlers once their keys are gone', function() {
    let obj = {'file': 'https://fake.com/#/?file=file.csv'};
    rm.registerUrlHandler(handler);
    spyOn(rm, 'getSearch').andCallFake(function() {
      return obj;
    });
    spyOn(handler, 'handle').andCallThrough();
    spyOn(handler, 'unhandleAll').andCallThrough();

    rm.initialize();
    expect(handler.handle.calls.length).toBe(1);
    expect(handler.handlesCache[FileUrlHandler.KEY]).toEqual(['https://fake.com/#/?file=file.csv']);

    // set the search object to be empty
    obj = {};
    rm.onRouteUpdate();

    expect(handler.unhandleAll.calls.length).toBe(1);
    expect(handler.handlesCache[FileUrlHandler.KEY]).toBe(undefined);
  });
});
