goog.require('os.mock');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('goog.Uri');

describe('os.net.RequestHandlerFactory', function() {
  var addHandler;
  var originalList = null;

  it('should prevent the os.mock beforeEach from meddling with the test', function() {
    originalList = os.net.RequestHandlerFactory.list_;
    addHandler = os.net.RequestHandlerFactory.addHandler;
    os.net.RequestHandlerFactory.addHandler = goog.nullFunction;

    // ensure we start with an empty factory
    os.net.RequestHandlerFactory.list_ = null;
  });

  it('should accept a proper handler', function() {
    addHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.list_.length).toBe(1);
  });

  it('should not accept more than one handler of the same type', function() {
    addHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.list_.length).toBe(1);
  });

  it('should generate a list of handlers for a URI', function() {
    var handlers = os.net.RequestHandlerFactory.getHandlers(
        'GET', new goog.Uri('/thisisatest.html'));

    expect(handlers.length).toBe(1);
  });

  it('should not generate handlers for URIs that can\'t be handled', function() {
    var handlers = os.net.RequestHandlerFactory.getHandlers(
        'GET', new goog.Uri('https://ssdn-culebra.stwan.bits/test.html'));

    expect(handlers).toBe(null);
  });

  it('should remove a handler', function() {
    os.net.RequestHandlerFactory.removeHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.list_.length).toBe(0);
  });

  it('should restore the peace', function() {
    os.net.RequestHandlerFactory.list_ = originalList;
    os.net.RequestHandlerFactory.addHandler = addHandler;
  });
});
