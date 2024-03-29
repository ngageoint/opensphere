goog.require('goog.Promise');
goog.require('os.data.ConfigDescriptor');
goog.require('os.net.Request');
goog.require('os.ui.data.BaseProvider');
goog.require('plugin.tileserver');
goog.require('plugin.tileserver.Tileserver');

describe('plugin.tileserver.Tileserver', function() {
  const Promise = goog.module.get('goog.Promise');
  const {default: ConfigDescriptor} = goog.module.get('os.data.ConfigDescriptor');
  const {default: Request} = goog.module.get('os.net.Request');
  const {default: BaseProvider} = goog.module.get('os.ui.data.BaseProvider');

  const {ID} = goog.module.get('plugin.tileserver');
  const {default: Tileserver} = goog.module.get('plugin.tileserver.Tileserver');

  it('should configure properly', function() {
    var p = new Tileserver();
    var conf = {
      type: ID,
      label: 'Test Server',
      url: 'http://localhost/doesnotexist.json'
    };

    p.configure(conf);

    expect(p.getLabel()).toBe(conf.label);
    expect(p.getUrl()).toBe(conf.url);
  });

  it('should load valid JSON', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving
    // to valid JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve('[]'));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).not.toHaveBeenCalled();
    });
  });

  it('should error on invalid JSON', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving
    // to invalid JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve('[wut'));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).toHaveBeenCalled();
    });
  });

  it('should error on request error', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise rejecting
    // with errors
    spyOn(Request.prototype, 'getPromise').andReturn(
        // request rejects with arrays of all errors that occurred
        Promise.reject(['something awful happend']));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onError.calls.length;
    });

    runs(function() {
      expect(p.onLoad).not.toHaveBeenCalled();
      expect(p.onError).toHaveBeenCalled();
    });
  });

  it('should ignore JSON that is not an array', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving
    // to valid JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve('{}'));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).toHaveBeenCalled();
    });
  });

  it('should parse Tileserver JSON', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving to some Tileserver JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve(JSON.stringify(
        [{
          tilejson: '2.0.0',
          name: 'Klokantech Basic',
          attribution: 'This is a test',
          minzoom: 0,
          maxzoom: 20,
          bounds: [8.275, 47.225, 8.8, 47.533],
          format: 'png',
          type: 'baselayer',
          tiles: ['http://localhost:8081/styles/klokantech-basic/{z}/{x}/{y}.png'],
          center: [8.537500000000001, 47.379000000000005, 11]
        }, {
          tilejson: '2.0.0',
          name: 'Klokantech Basic 2',
          attribution: 'This is a test',
          minzoom: 0,
          maxzoom: 20,
          bounds: [8.275, 47.225, 8.8, 47.533],
          format: 'png',
          tiles: ['http://localhost:8081/styles/klokantech-basic/{z}/{x}/{y}.png'],
          center: [8.537500000000001, 47.379000000000005, 11]
        }, {
          tilejson: '2.0.0',
          format: 'pbf'
        }, {
          something: true
        }]
    )));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    // add a config descriptor to the datamanager so that we can test updating on one of the layers
    var id = p.getId() + BaseProvider.ID_DELIMITER + 'Klokantech Basic';
    var descriptor = new ConfigDescriptor();
    descriptor.setBaseConfig({
      id: id
    });
    os.dataManager.addDescriptor(descriptor);

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).not.toHaveBeenCalled();
      expect(p.getChildren().length).toBe(2);
      expect(p.getChildren()[0].getLabel()).toBe('Klokantech Basic');
      expect(p.getChildren()[1].getLabel()).toBe('Klokantech Basic 2');
    });
  });
});
