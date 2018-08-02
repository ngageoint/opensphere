goog.require('os.file.FileUrlHandler');
goog.require('os.mock');
goog.require('os.ui.route.RouteManager');


describe('os.ui.route.RouteManager', function() {
  var rm, handler;

  beforeEach(function() {
    inject(function($injector) {
      os.ui.injector = $injector;
    });

    rm = new os.ui.route.RouteManager();
    handler = new os.file.FileUrlHandler();
  });

  it('should register URL handlers', function() {
    rm.registerUrlHandler(handler);

    expect(goog.object.getCount(rm.routeHandlers_)).toBe(1);
    expect(rm.routeHandlers_[os.file.FileUrlHandler.KEY]).not.toBe(null);
    expect(rm.routeHandlers_[os.file.FileUrlHandler.KEY].length).toBe(1);
    expect(rm.routeHandlers_[os.file.FileUrlHandler.KEY][0]).toBe(handler);
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
    var obj = {'file': 'https://fake.com/#/?file=file.csv'};
    rm.registerUrlHandler(handler);
    spyOn(rm, 'getSearch').andCallFake(function() {
      return obj;
    });
    spyOn(handler, 'handle').andCallThrough();
    spyOn(handler, 'unhandleAll').andCallThrough();

    rm.initialize();
    expect(handler.handle.calls.length).toBe(1);
    expect(handler.handlesCache[os.file.FileUrlHandler.KEY]).toEqual(['https://fake.com/#/?file=file.csv']);

    // set the search object to be empty
    obj = {};
    rm.onRouteUpdate();

    expect(handler.unhandleAll.calls.length).toBe(1);
    expect(handler.handlesCache[os.file.FileUrlHandler.KEY]).toBe(undefined);
  });
});
