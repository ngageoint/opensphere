goog.provide('osasm.wait');

osasm.wait.waitForIt = function() {
  beforeEach(function() {
    waitsFor(function() {
      return !!window.osasm;
    }, 3000);
  });
};

osasm.wait.waitForIt();
