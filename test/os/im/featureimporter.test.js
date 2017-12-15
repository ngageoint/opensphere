goog.require('ol.Feature');
goog.require('os.im.FeatureImporter');
goog.require('os.ui');

describe('os.im.FeatureImporter', function() {
  it('should sanitize data to protect against XSS attacks', function() {
    os.im.FeatureImporter.sanitize = os.ui.sanitize;

    var attack = new ol.Feature({
      field1: 'some value <iframe src="http://malicious.evil.com"></iframe>',
      field2: '42 <script>$(document.body).remove()</script>',
      count: 3
    });

    var safe = new ol.Feature({
      field1: 'some value',
      field2: '42',
      count: 3
    });

    var importer = new os.im.FeatureImporter();

    importer.sanitize(attack);
    importer.sanitize(safe);

    expect(attack.get('field1')).toBe(safe.get('field1'));
    expect(attack.get('field2')).toBe(safe.get('field2'));
    expect(goog.isNumber(attack.get('count'))).toBe(true);
    expect(attack.get('count')).toBe(safe.get('count'));
  });
});
