goog.require('os.Fields');
goog.require('os.im.mapping');
goog.require('os.im.mapping.BearingMapping');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.im.mapping.BearingMapping', function() {
  const {default: Fields} = goog.module.get('os.Fields');
  const mapping = goog.module.get('os.im.mapping');
  const {default: BearingMapping} = goog.module.get('os.im.mapping.BearingMapping');

  it('should auto detect bearing string types', function() {
    // test with a feature (WFS layer or csv import)
    // does not contain the correct fields
    var a = new Feature();
    a.set('value1', 'nope');
    a.set('value2', 'nope');
    a.set('value3', 'nope');
    a.set('value4', 'nope');

    // should return null because the correct fields do
    // not exist in either object
    var pm = new BearingMapping();
    var m = pm.autoDetect([a]);
    expect(m).toBeNull();


    // add a bearing column but no units
    a.set('BEARING', '50');
    m = pm.autoDetect([a]);

    // should return a legit BearingMapping object with the field set and unit field at default
    expect(m).not.toBeNull();
    expect(m.field).toBe('BEARING');
  });

  it('should map bearing to a feature', function() {
    var feature = new Feature(new Point([0, 0]));
    feature.set('BEARING', '50');

    var m = new BearingMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have BEARING remain the same
    expect(mapping.getItemField(feature, Fields.BEARING)).toBe(50);
  });

  it('should normalize bearing column names', function() {
    var feature = new Feature(new Point([0, 0]));
    feature.set('HEADING', '50');

    var m = new BearingMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have BEARING remain the same and new derived column
    expect(mapping.getItemField(feature, 'BEARING')).toBe(50);
    expect(mapping.getItemField(feature, 'HEADING')).toBe('50');
  });
});
