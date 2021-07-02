goog.module('os.data.IAreaTest');
goog.module.declareLegacyNamespace();

const Listenable = goog.requireType('goog.events.Listenable');


/**
 * @interface
 * @extends {Listenable}
 */
class IAreaTest {
  /**
   * @param {ol.Feature} area
   * @return {!string} key
   */
  getTestAreaKey(area) {}

  /**
   * Kicks off a test against an area for a given thing.
   *
   * @param {ol.Feature} area
   * @return {boolean|!goog.Promise} the result of the test (true/false) or a promise that resolves
   *    to the result of the test. Promises in this stack should always resolve to true/false for
   *    pass fail and never reject or error.
   */
  testArea(area) {}
}


/**
 * @type {string}
 * @const
 */
IAreaTest.ID = 'os.data.IAreaTest';


exports = IAreaTest;
