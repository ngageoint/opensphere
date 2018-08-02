goog.require('os.ogc.filter.OGCFilterModifier');
goog.require('goog.Uri');


describe('os.ogc.filter.OGCFilterModifier', function() {
  it('initializes with defaults', function() {
    var modifier = new os.ogc.filter.OGCFilterModifier();
    expect(modifier.filter_).toBe(false);
    expect(modifier.identifiers_).toBe(false);
    expect(modifier.param_).toBe('filter');
    expect(modifier.temporal_).toBe(true);
    expect(modifier.id_).toBe('OGCFilter');
    expect(modifier.priority_).toBe(100);
  });

  it('initializes with options', function() {
    var testParam = 'testParam';
    var options = {
      filter: true,
      identifiers: true,
      param: testParam,
      temporal: false
    };

    var modifier = new os.ogc.filter.OGCFilterModifier(options);
    expect(modifier.filter_).toBe(true);
    expect(modifier.identifiers_).toBe(true);
    expect(modifier.param_).toBe(testParam);
    expect(modifier.temporal_).toBe(false);
    expect(modifier.id_).toBe('OGCFilter');
    expect(modifier.priority_).toBe(100);
  });

  it('modifies a uri param', function() {
    var testParam = 'testParam';
    var options = {
      filter: true,
      identifiers: true,
      param: testParam,
      temporal: true
    };
    var modifier = new os.ogc.filter.OGCFilterModifier(options);

    var origUri = new goog.Uri();
    origUri.getQueryData().set(testParam, '');

    var uri = origUri.clone();
    modifier.modify(uri);

    var expected = '<Filter xmlns="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">' +
        '<And>{identifiers}{temporal}{customFilter}</And></Filter>';
    expect(uri.getQueryData().get(testParam)).toBe(expected);

    uri = origUri.clone();
    modifier.identifiers_ = false;
    modifier.temporal_ = false;
    modifier.modify(uri);

    var expected = '<Filter xmlns="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">' +
        '<And>{customFilter}</And></Filter>';
    expect(uri.getQueryData().get(testParam)).toBe(expected);

    uri = origUri.clone();
    modifier.filter_ = false;
    modifier.modify(uri);

    var expected = undefined;
    expect(uri.getQueryData().get(testParam)).toBe(expected);

    uri = origUri.clone();
    modifier.modify(uri);
    expect(uri.getQueryData().get(testParam)).toBeUndefined();
  });
});
