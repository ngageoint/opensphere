goog.require('os.ogc.wfs.DescribeFeatureTypeParser');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');


describe('os.ogc.wfs.DescribeFeatureTypeParser', function() {
  var dftUrl = '/base/test/os/ogc/wfs/dft.xml';
  var errorUrl = '/base/test/os/ogc/wfs/dftError.xml';

  var parser = null;
  beforeEach(function() {
    parser = new os.ogc.wfs.DescribeFeatureTypeParser();
    complete = false;
  });

  it('handles errors gracefully', function() {
    var testError = null;
    var xhr = new goog.net.XhrIo();
    xhr.listen(goog.net.EventType.SUCCESS, function() {
      testError = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(errorUrl);
    });

    waitsFor(function() {
      return testError != null;
    }, 'test error to load');

    runs(function() {
      var featureTypes = parser.parse(testError);
      expect(featureTypes).not.toBeNull();
      expect(featureTypes.length).toBe(0);
    });
  });

  it('parses a WFS DescribeFeatureType', function() {
    var testData = null;
    var xhr = new goog.net.XhrIo();
    xhr.listen(goog.net.EventType.SUCCESS, function() {
      testData = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(dftUrl);
    });

    waitsFor(function() {
      return testData != null;
    }, 'test DescribeFeatureType to load');

    runs(function() {
      var featureTypes = parser.parse(testData);
      expect(featureTypes).not.toBeNull();
      expect(featureTypes.length).toBe(1);

      var featureType = featureTypes[0];
      expect(featureType.getTypeName()).toBe('TEST');
      expect(featureType.getGeometryColumnName()).toBe('GEOM');
      expect(featureType.getStartDateColumnName()).toBe('validTime');
      expect(featureType.getEndDateColumnName()).toBe('validTime');

      var columns = featureType.getColumns();
      expect(columns).not.toBeNull();
      expect(columns.length).toBe(10);
      expect(columns[0].name).toBe('ALT');
      expect(columns[0].type).toBe('decimal');
    });
  });
});
