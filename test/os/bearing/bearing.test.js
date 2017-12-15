goog.require('os.bearing');
goog.require('os.net.Request');
goog.require('osasm.wait');


describe('os.bearing', function() {
  // for the magnetic bearing calculations, the date matters, so we use this static date, otherwise the result
  // values will drift over time as the library simply uses new Date() otherwise
  var date = new Date(1488386496470);

  var precision = 8;
  var geodesic = os.interpolate.Method.GEODESIC;
  var rhumb = os.interpolate.Method.RHUMB;

  beforeEach(function() {
    if (!os.bearing.Geomag) {
      runs(function() {
        // load the model
        var url = '/base/test/resources/WMM.COF';
        var request = new os.net.Request();
        request.setUri(url);
        request.listenOnce(goog.net.EventType.SUCCESS, os.bearing.onGeomag);
        request.listenOnce(goog.net.EventType.ERROR, os.bearing.onGeomag);
        request.load();
      });

      waitsFor(function() {
        return !!os.bearing.Geomag;
      });
    }
  });

  it('should get bearings correctly', function() {
    expect(os.bearing.getBearing([5, 10], [15, 20])).toBeCloseTo(42.99295488831754, precision);
    expect(os.bearing.getBearing([5, 10], [15, 20], rhumb)).toBeCloseTo(44.14439180550811, precision);

    expect(os.bearing.getBearing([-50, 80], [75, -60])).toBeCloseTo(72.0382868370632, precision);
    expect(os.bearing.getBearing([-50, 80], [75, -60], rhumb)).toBeCloseTo(149.74888585793278, precision);
  });

  it('should default to geodesic', function() {
    var a = os.bearing.getBearing([5, 10], [15, 20]);
    var b = os.bearing.getBearing([5, 10], [15, 20], geodesic);

    expect(a).toBeCloseTo(b, 12);
  });

  it('should get magnetic bearings correctly', function() {
    os.settings.set(os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.MAGNETIC);

    // this calculation seemed to vary sometimes... so use toBeCloseTo... maybe reinvestigate this in the future
    expect(os.bearing.getBearing([5, 10], [15, 20], undefined, date)).toBeCloseTo(44.22244309187904, precision);
    expect(os.bearing.getBearing([5, 10], [15, 20], rhumb, date)).toBeCloseTo(45.37388000911791, precision);

    expect(os.bearing.getBearing([-50, 80], [75, -60], undefined, date)).toBeCloseTo(112.16177561564162, precision);
    expect(os.bearing.getBearing([-50, 80], [75, -60], rhumb, date)).toBeCloseTo(189.87237463643038, precision);
  });

  it('should format bearings correctly', function() {
    os.settings.set(os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.TRUE_NORTH);

    expect(os.bearing.modifyBearing(-150, [5, 10])).toBe(210);
    expect(os.bearing.modifyBearing(-50, [5, 10])).toBe(310);
    expect(os.bearing.modifyBearing(165, [5, 10])).toBe(165);
  });

  it('should format magnetic bearings correctly', function() {
    os.settings.set(os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.MAGNETIC);

    expect(os.bearing.modifyBearing(-150, [5, 10], date)).toBeCloseTo(211.2, 1);
    expect(os.bearing.modifyBearing(-50, [60, 40], date)).toBeCloseTo(304.4, 1);
    expect(os.bearing.modifyBearing(165, [-50, -30], date)).toBeCloseTo(182.5, 1);
  });
});
