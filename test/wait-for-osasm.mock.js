goog.provide('os.osasm.wait');

/**
 * Waits for the `osasm` library to be loaded.
 */
os.osasm.wait.waitForIt = function() {
  beforeEach(function() {
    waitsFor(function() {
      return !!window.osasm;
    }, 3000, 'osasm to load');
  });
};
