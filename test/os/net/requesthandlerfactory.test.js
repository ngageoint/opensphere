goog.require('goog.Uri');
goog.require('os.fn');
goog.require('os.mock');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');

describe('os.net.RequestHandlerFactory', function() {
  const Uri = goog.module.get('goog.Uri');
  const RequestHandlerFactory = goog.module.get('os.net.RequestHandlerFactory');
  const {default: SameDomainHandler} = goog.module.get('os.net.SameDomainHandler');

  let originalList = null;

  beforeEach(() => {
    // ensure we start with an empty factory
    originalList = RequestHandlerFactory.getAllHandlers();
    RequestHandlerFactory.resetHandlers();
  });

  afterEach(() => {
    // restore the original handlers
    RequestHandlerFactory.resetHandlers();
    originalList.forEach(RequestHandlerFactory.addHandler);
  });

  it('should accept a proper handler', function() {
    RequestHandlerFactory.addHandler(SameDomainHandler);
    expect(RequestHandlerFactory.getAllHandlers().length).toBe(1);
  });

  it('should not accept more than one handler of the same type', function() {
    RequestHandlerFactory.addHandler(SameDomainHandler);
    RequestHandlerFactory.addHandler(SameDomainHandler);
    expect(RequestHandlerFactory.getAllHandlers().length).toBe(1);
  });

  it('should generate a list of handlers for a URI', function() {
    RequestHandlerFactory.addHandler(SameDomainHandler);

    const handlers = RequestHandlerFactory.getHandlers(
        'GET', new Uri('/thisisatest.html'));

    expect(handlers.length).toBe(1);
  });

  it('should not generate handlers for URIs that can\'t be handled', function() {
    RequestHandlerFactory.addHandler(SameDomainHandler);

    const handlers = RequestHandlerFactory.getHandlers(
        'GET', new Uri('https://www.docker.com/test.html'));

    expect(handlers).toBe(null);
  });

  it('should remove a handler', function() {
    RequestHandlerFactory.addHandler(SameDomainHandler);
    expect(RequestHandlerFactory.getAllHandlers().length).toBe(1);

    RequestHandlerFactory.removeHandler(SameDomainHandler);
    expect(RequestHandlerFactory.getAllHandlers().length).toBe(0);
  });
});
