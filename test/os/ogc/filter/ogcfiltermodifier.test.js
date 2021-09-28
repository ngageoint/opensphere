goog.require('goog.Uri');
goog.require('os.ogc.filter.OGCFilterModifier');


describe('os.ogc.filter.OGCFilterModifier', function() {
  const Uri = goog.module.get('goog.Uri');
  const {default: OGCFilterModifier} = goog.module.get('os.ogc.filter.OGCFilterModifier');

  it('initializes with defaults', function() {
    var modifier = new OGCFilterModifier();
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

    var modifier = new OGCFilterModifier(options);
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
    var modifier = new OGCFilterModifier(options);

    var origUri = new Uri();
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
