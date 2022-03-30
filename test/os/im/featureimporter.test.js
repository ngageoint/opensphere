goog.require('os.im.FeatureImporter');
goog.require('os.ui');

import Feature from 'ol/src/Feature.js';

describe('os.im.FeatureImporter', function() {
  const {default: FeatureImporter} = goog.module.get('os.im.FeatureImporter');

  it('should sanitize data to protect against XSS attacks', function() {
    var attack = new Feature({
      field1: 'some value <iframe src="http://malicious.evil.com"></iframe>',
      field2: '42 <script>$(document.body).remove()</script>',
      count: 3
    });

    var safe = new Feature({
      field1: 'some value',
      field2: '42',
      count: 3
    });

    var importer = new FeatureImporter();

    importer.sanitize(attack);
    importer.sanitize(safe);

    expect(attack.get('field1')).toBe(safe.get('field1'));
    expect(attack.get('field2')).toBe(safe.get('field2'));
    expect(typeof attack.get('count') === 'number').toBe(true);
    expect(attack.get('count')).toBe(safe.get('count'));
  });
});
