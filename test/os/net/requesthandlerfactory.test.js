goog.require('goog.Uri');
goog.require('os.fn');
goog.require('os.mock');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');

describe('os.net.RequestHandlerFactory', function() {
  let originalList = null;

  beforeEach(() => {
    // ensure we start with an empty factory
    originalList = os.net.RequestHandlerFactory.getAllHandlers();
    os.net.RequestHandlerFactory.resetHandlers();
  });

  afterEach(() => {
    // restore the original handlers
    os.net.RequestHandlerFactory.resetHandlers();
    originalList.forEach(os.net.RequestHandlerFactory.addHandler);
  });

  it('should accept a proper handler', function() {
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.getAllHandlers().length).toBe(1);
  });

  it('should not accept more than one handler of the same type', function() {
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.getAllHandlers().length).toBe(1);
  });

  it('should generate a list of handlers for a URI', function() {
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

    const handlers = os.net.RequestHandlerFactory.getHandlers(
        'GET', new goog.Uri('/thisisatest.html'));

    expect(handlers.length).toBe(1);
  });

  it('should not generate handlers for URIs that can\'t be handled', function() {
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

    const handlers = os.net.RequestHandlerFactory.getHandlers(
        'GET', new goog.Uri('https://www.docker.com/test.html'));

    expect(handlers).toBe(null);
  });

  it('should remove a handler', function() {
    os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.getAllHandlers().length).toBe(1);

    os.net.RequestHandlerFactory.removeHandler(os.net.SameDomainHandler);
    expect(os.net.RequestHandlerFactory.getAllHandlers().length).toBe(0);
  });
});
