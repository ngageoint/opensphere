goog.provide('os.bearing.geomag.wait');

goog.require('goog.net.EventType');
goog.require('os.bearing');
goog.require('os.net.Request');

beforeEach(function() {
  if (!os.bearing.geomag_) {
    runs(function() {
      var request = new os.net.Request('/base/vendor/geomag/WMM.COF');
      request.listenOnce(goog.net.EventType.SUCCESS, os.bearing.onGeomag);
      request.listenOnce(goog.net.EventType.ERROR, os.bearing.onGeomag);
      request.load();
    });

    waitsFor(function() {
      return !!os.bearing.geomag_;
    }, 'geomag to load');
  }
});
