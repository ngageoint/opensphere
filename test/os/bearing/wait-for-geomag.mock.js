goog.provide('os.bearing.geomag.wait');

goog.require('goog.net.EventType');
goog.require('os.bearing');
goog.require('os.net.Request');

beforeEach(function() {
  const NetEventType = goog.module.get('goog.net.EventType');
  const bearing = goog.module.get('os.bearing');
  const Request = goog.module.get('os.net.Request');

  if (!bearing.isGeomagLoaded()) {
    runs(function() {
      const request = new Request('/base/vendor/geomag/WMM.txt');
      request.listenOnce(NetEventType.SUCCESS, bearing.onGeomag);
      request.listenOnce(NetEventType.ERROR, bearing.onGeomag);
      request.load();
    });

    waitsFor(function() {
      return bearing.isGeomagLoaded();
    }, 'geomag to load');
  }
});
