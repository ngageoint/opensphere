goog.provide('os.data.AreaTestEventType');
goog.provide('os.data.IAreaTest');

goog.require('goog.events.Listenable');



/**
 * @interface
 * @extends {goog.events.Listenable}
 */
os.data.IAreaTest = function() {};


/**
 * @type {string}
 * @const
 */
os.data.IAreaTest.ID = 'os.data.IAreaTest';


/**
 * @param {ol.Feature} area
 * @return {!string} key
 */
os.data.IAreaTest.prototype.getTestAreaKey;


/**
 * Kicks off a test against an area for a given thing. These tend to be asynchronous, so
 * fire AreaTestEventType.PASS or FAIL when finished.
 *
 * @param {ol.Feature} area
 * @return {boolean|!goog.Promise} the result of the test (true/false) or a promise that resolves
 *    to the result of the test. Promises in this stack should always resolve to true/false for
 *    pass fail and never reject or error.
 */
os.data.IAreaTest.prototype.testArea;
