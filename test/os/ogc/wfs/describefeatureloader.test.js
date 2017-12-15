goog.require('os.ogc.wfs.DescribeFeatureLoader');


describe('os.ogc.wfs.DescribeFeatureLoader', function() {
  var dftType = 'testNS:TEST';
  var dftUrl = '/base/test/os/ogc/wfs/dft.xml';
  var dftParams = '?SERVICE=WFS&VERSION=1.1.0&REQUEST=DescribeFeatureType&TYPENAME=' + dftType;
  var loader = null;

  var complete = false;
  var onComplete = function() {
    complete = true;
  };

  beforeEach(function() {
    if (loader) {
      loader.removeAllListeners();
    }

    loader = new os.ogc.wfs.DescribeFeatureLoader();
    complete = false;
  });

  it('fails gracefully when typename or url are not set', function() {
    // no typename or url
    runs(function() {
      expect(loader.getTypename()).toBeNull();
      expect(loader.getUrl()).toBeNull();
      loader.listenOnce(goog.net.EventType.COMPLETE, onComplete, false, this);
      spyOn(loader, 'onDescribeComplete_').andCallThrough();
      spyOn(loader, 'onDescribeError_').andCallThrough();
      loader.load();
    });

    waitsFor(function() {
      return complete;
    }, 'complete event to fire (no typename or url)');

    // no url
    runs(function() {
      expect(loader.onDescribeComplete_).not.toHaveBeenCalled();
      expect(loader.onDescribeError_).not.toHaveBeenCalled();
      expect(loader.getFeatureType()).toBeNull();

      complete = false;
      loader.setTypename(dftType);

      expect(loader.getTypename()).toBe(dftType);
      expect(loader.getUrl()).toBeNull();

      loader.listenOnce(goog.net.EventType.COMPLETE, onComplete, false, this);
      loader.load();
    });

    waitsFor(function() {
      return complete;
    }, 'complete event to fire (no url)');

    // no typename
    runs(function() {
      expect(loader.onDescribeComplete_).not.toHaveBeenCalled();
      expect(loader.onDescribeError_).not.toHaveBeenCalled();
      expect(loader.getFeatureType()).toBeNull();

      complete = false;
      loader.setTypename(null);
      loader.setUrl('/doesnt/matter');

      expect(loader.getTypename()).toBeNull();
      expect(loader.getUrl()).toBe('/doesnt/matter');

      loader.listenOnce(goog.net.EventType.COMPLETE, onComplete, false, this);
      loader.load();
    });

    waitsFor(function() {
      return complete;
    }, 'complete event to fire (no typename)');

    runs(function() {
      expect(loader.onDescribeComplete_).not.toHaveBeenCalled();
      expect(loader.onDescribeError_).not.toHaveBeenCalled();
      expect(loader.getFeatureType()).toBeNull();
    });
  });

  it('fails gracefully when request throws an error', function() {
    runs(function() {
      loader.setTypename(dftType);
      loader.setUrl('/doesnt/exist');
      loader.listenOnce(goog.net.EventType.COMPLETE, onComplete, false, this);
      spyOn(loader, 'onDescribeError_').andCallThrough();
      loader.load();
    });

    waitsFor(function() {
      return complete;
    }, 'complete event to fire (request error)');

    runs(function() {
      expect(loader.onDescribeError_).toHaveBeenCalled();
      expect(loader.getFeatureType()).toBeNull();
    });
  });

  it('initializes url and params', function() {
    loader.setUrl(dftUrl + dftParams);

    expect(loader.getUrl()).toBe(dftUrl);
    expect(loader.getTypename()).toBe(dftType);
  });

  it('loads and parses a WFS DescribeFeatureType', function() {
    runs(function() {
      loader.setUrl(dftUrl + dftParams);
      loader.listenOnce(goog.net.EventType.COMPLETE, onComplete, false, this);
      loader.load();
    });

    waitsFor(function() {
      return complete;
    }, 'DescribeFeatureType to be loaded');

    runs(function() {
      expect(loader.getFeatureType()).toBeDefined();
      expect(loader.getFeatureType()).not.toBeNull();
    });
  });
});
