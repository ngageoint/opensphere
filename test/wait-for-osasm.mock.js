goog.provide('osasm.wait');

/**
 * Waits for the `osasm` library to be loaded.
 */
osasm.wait.waitForIt = function() {
  beforeEach(function() {
    waitsFor(function() {
      return !!window.osasm;
    }, 3000, 'osasm to load');
  });
};
