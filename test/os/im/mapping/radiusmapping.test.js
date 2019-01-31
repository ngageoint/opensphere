goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.math');
goog.require('os.math.Units');

describe('os.im.mapping.RadiusMapping', function() {
  it('should auto detect radius string types', function() {
    // test with a feature (WFS layer or csv import)
    // does not contain the correct fields
    var feature = new ol.Feature();
    feature.set('value1', 'nope');
    feature.set('value2', 'nope');
    feature.set('value3', 'nope');
    feature.set('value4', 'nope');

    // should return null because the correct fields do not exist in either object
    var rm = new os.im.mapping.RadiusMapping();
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
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('RADIUS', '50');

    var m = new os.im.mapping.RadiusMapping();
    var rm = m.autoDetect([feature]);
    rm.execute(feature);

    // feature should have RADIUS defaulted to nmi
    expect(os.im.mapping.getItemField(feature, os.Fields.RADIUS)).toBeCloseTo(92598.23703685642, 10);
  });

  it('should normalize radius column names', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('CEP', '50');
    feature.set('CEP_UNITS', 'yd');

    var m = new os.im.mapping.RadiusMapping();
    var rm = m.autoDetect([feature]);
    rm.execute(feature);

    // feature should have RADIUS remain the same and new derived column
    expect(os.im.mapping.getItemField(feature, os.Fields.RADIUS)).toBeCloseTo(45.720137891935885, 10);
    expect(os.im.mapping.getItemField(feature, os.Fields.RADIUS_UNITS)).toBe('yd');
    expect(os.im.mapping.getItemField(feature, 'CEP')).toBe('50');
    expect(os.im.mapping.getItemField(feature, 'CEP_UNITS')).toBe('yd');
  });
});
