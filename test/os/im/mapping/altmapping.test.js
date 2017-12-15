goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.im.mapping.AltMapping');
goog.require('os.math');
goog.require('os.math.Units');

describe('os.im.mapping.AltMapping', function() {
  it('should auto detect altitude string types', function() {
    // test with a feature (WFS layer or csv import)
    // does not contain the correct fields
    var a = new ol.Feature();
    a.set('value1', 'nope');
    a.set('value2', 'nope');
    a.set('value3', 'nope');
    a.set('value4', 'nope');

    // should return null because the correct fields do
    // not exist in either object
    var pm = new os.im.mapping.AltMapping();
    var m = pm.autoDetect([a]);
    expect(m).toBeNull();


    // add an altitude column but no units
    a.set('ALT', '5000');
    m = pm.autoDetect([a]);

    // should return a legit AltMapping object with the field set and unit field at default
    expect(m).not.toBeNull();
    expect(m.field).toBe('ALT');
    expect(m.unitsField).toBe('ALTITUDE_UNITS');


    // test with both altitude and units columns
    a.set('ALT_UNITS', 'km');
    m = pm.autoDetect([a]);

    // should return a legit AltMapping object with the field set and unit field at ALT_UNITS
    expect(m).not.toBeNull();
    expect(m.field).toBe('ALT');
    expect(m.unitsField).toBe('ALT_UNITS');
    expect(m.unitsOverride).toBe(false);
    expect(m.getUnits()).toBe('m');

    pm.setUnits('nmi');
    m = pm.autoDetect([a]);

    // test with unit override that is allowed with CSV imports
    // should return a legit mapping with the field set and units nmi
    expect(m).not.toBeNull();
    expect(m.field).toBe('ALT');

    // unitsField should not be set since we are overriding it
    expect(m.unitsField).toBe('ALT_UNITS');
    expect(m.unitsOverride).toBe(true);
    expect(m.getUnits()).toBe('nmi');
  });

  it('should map altitude to a feature', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('ALTITUDE', '5000');
    feature.set('ALTITUDE_UNITS', 'm');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have ALTITUDE, ALTITUDE_UNITS remain the same
    expect(os.im.mapping.getItemField(feature, os.Fields.ALT)).toBe('5000');
    expect(os.im.mapping.getItemField(feature, os.Fields.ALT_UNITS)).toBe('m');
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(5000);
  });

  it('should map altitude to a feature with normalized units', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('ALTITUDE', '5000');
    feature.set('ALTITUDE_UNITS', 'FEET');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // altitude should be converted to meters, but the original columns should be maintained.
    expect(os.im.mapping.getItemField(feature, os.Fields.ALT)).toBe('5000');
    expect(os.im.mapping.getItemField(feature, os.fields.DEFAULT_ALT_COL_NAME)).toBe(1524);
    expect(os.im.mapping.getItemField(feature, os.Fields.ALT_UNITS)).toBe('FEET');
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(1524);
  });

  it('should map inverse altitude to a feature', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('DEPTH', '5000');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have ALTITUDE, ALTITUDE_UNITS remain the same
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(-5000);
  });

  it('should map inverse altitude to a feature with normalized units', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('DEPTH', '50');
    feature.set('DEPTH_UNITS', 'KM');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // altitude should be converted to meters, but the original columns should be maintained.
    expect(os.im.mapping.getItemField(feature, os.fields.DEFAULT_ALT_COL_NAME)).toBe(-50000);
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(-50000);
  });

  it('should normalize altitude column names', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('ELEV', '5000');
    feature.set('ELEV_UNITS', 'm');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have ELEV, ELEV_UNITS remain the same
    // and new derived column
    expect(os.im.mapping.getItemField(feature, 'ELEV')).toBe('5000');
    expect(os.im.mapping.getItemField(feature, os.fields.DEFAULT_ALT_COL_NAME)).toBe(5000);
    expect(os.im.mapping.getItemField(feature, 'ELEV_UNITS')).toBe('m');
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(5000);
  });

  it('should normalize altitude column names and units', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set('ELEV', '5000');
    feature.set('ELEV_UNITS', 'nmi');

    var m = new os.im.mapping.AltMapping();
    var nm = m.autoDetect([feature]);
    nm.execute(feature);

    // feature should have ELEV, ELEV_UNITS remain the same
    // and new derived column
    expect(os.im.mapping.getItemField(feature, os.fields.DEFAULT_ALT_COL_NAME)).toBe(9259824);
    expect(os.im.mapping.getItemField(feature, 'ELEV')).toBe('5000');
    expect(os.im.mapping.getItemField(feature, 'ELEV_UNITS')).toBe('nmi');
    expect(feature.getGeometry().getFirstCoordinate()[2]).toBe(9259824);
  });
});
