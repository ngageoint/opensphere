goog.provide('os.osasm.wait');

if (!window.osasm || !window.osasm.geodesicDirect) {
  beforeEach(function() {
    waitsFor(function() {
      return !!window.osasm && !!osasm.geodesicDirect;
    }, 'osasm to load');
  });
}
