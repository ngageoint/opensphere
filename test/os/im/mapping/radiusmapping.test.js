goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.fields');
goog.require('os.im.mapping');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.math');
goog.require('os.math.Units');

describe('os.im.mapping.RadiusMapping', function() {
  const Feature = goog.module.get('ol.Feature');
  const Point = goog.module.get('ol.geom.Point');
  const Fields = goog.module.get('os.Fields');
  const fields = goog.module.get('os.fields');
  const mapping = goog.module.get('os.im.mapping');
  const RadiusMapping = goog.module.get('os.im.mapping.RadiusMapping');

  it('should auto detect radius string types', function() {
    // test with a feature (WFS layer or csv import)
    // does not contain the correct fields
    var feature = new Feature();
    feature.set('value1', 'nope');
    feature.set('value2', 'nope');
    feature.set('value3', 'nope');
    feature.set('value4', 'nope');

    // should return null because the correct fields do not exist in either object
    var rm = new RadiusMapping();
    var m = rm.autoDetect([feature]);
    expect(m).toBeNull();

    // add a radius column but no units
    feature.set('RADIUS', '5000');
    m = rm.autoDetect([feature]);

    // should return a legit RadiusMapping object with the field set and unit field at default
    expect(m).not.toBeNull();
    expect(m.field).toBe('RADIUS');
    expect(m.unitsField).toBe('RADIUS_UNITS');

    // test with both radius and units columns
    feature.set('RADIUS_UNITS', 'km');
    m = rm.autoDetect([feature]);

    // should return a legit RadiusMapping object with the field set and unit field at RADUIS_UNITS
    expect(m).not.toBeNull();
    expect(m.field).toBe('RADIUS');
    expect(m.unitsField).toBe('RADIUS_UNITS');
    expect(m.getUnits()).toBe('km');
  });

  it('should map radius to a feature', function() {
    var feature = new Feature(new Point([0, 0]));
    feature.set('RADIUS', '50');

    var m = new RadiusMapping();
    var rm = m.autoDetect([feature]);
    rm.execute(feature);

    // feature should have radius defaulted to nmi
    expect(mapping.getItemField(feature, Fields.RADIUS)).toBeCloseTo(50, 1);
    expect(mapping.getItemField(feature, fields.DEFAULT_RADIUS_COL_NAME)).toBeCloseTo(50, 1);
  });

  it('should normalize radius column names', function() {
    var feature = new Feature(new Point([0, 0]));
    feature.set('CEP', '50');
    feature.set('CEP_UNITS', 'yd');

    var m = new RadiusMapping();
    var rm = m.autoDetect([feature]);
    rm.execute(feature);

    // feature should have original column remain the same and new derived column
    expect(mapping.getItemField(feature, fields.DEFAULT_RADIUS_COL_NAME)).toBeCloseTo(0.024687369519647, .001);
    expect(mapping.getItemField(feature, Fields.RADIUS_UNITS)).toBe('yd');
    expect(mapping.getItemField(feature, 'CEP')).toBe('50');
    expect(mapping.getItemField(feature, 'CEP_UNITS')).toBe('yd');
  });
});
