goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('os.ogc.wfs.WFSFormatter');

describe('os.ogc.wfs.WFSFormatter', function() {
  const Uri = goog.module.get('goog.Uri');
  const QueryData = goog.module.get('goog.Uri.QueryData');
  const WFSFormatter = goog.module.get('os.ogc.wfs.WFSFormatter');

  it('gets the content type', function() {
    var formatter = new WFSFormatter();
    expect(formatter.getContentType()).toBe('text/xml');

    formatter.contentType = 'text/plain';
    expect(formatter.getContentType()).toBe('text/plain');

    formatter.contentType = '';
    expect(formatter.getContentType()).toBe('text/xml');
  });

  it('strips WFS parameters from query data', function() {
    var parameters = {
      'NOT_WFS1': 'value',
      'not_wfs2': 'value',
      'Not_Wfs3': 'value'
    };

    WFSFormatter.WFS_PARAMS.forEach(function(p, idx, arr) {
      // alternate lower/upper case to verify case doesn't matter for WFS params
      var key = idx % 2 == 0 ? p.toUpperCase() : p.toLowerCase();
      parameters[key] = 'value';
    });

    var queryData = QueryData.createFromMap(parameters);
    var uri = new Uri('http://fake.com');
    uri.setQueryData(queryData);

    var formatter = new WFSFormatter();
    formatter.format(uri);

    // removes all WFS parameters
    WFSFormatter.WFS_PARAMS.forEach(function(p) {
      expect(queryData.get(p)).toBeUndefined();
    });

    // leaves original parameters alone
    expect(queryData.get('NOT_WFS1')).toBe('value');
    expect(queryData.get('not_wfs2')).toBe('value');
    expect(queryData.get('Not_Wfs3')).toBe('value');
  });
});
