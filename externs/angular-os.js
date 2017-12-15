/**
 * @fileoverview BITS extension to the Angular externs.
 *
 * @externs
 */


/**
 *
 * @typedef {{
 *   notifyWhenNoOutstandingRequests: function(Function)
 * }}
 */
angular.$browser;


/**
 * Fires the callback when Angular has no outstanding requests ($http, $timeout, etc).
 *
 * Note: There is a comment in the Angular source suggesting prefixing this with $$ because it's intended to be private,
 * but as of Angular 1.4 RC5 the function is available for use. This is what Protractor uses in its waitForAngular
 * function, so if this call ever changes we should check what Protractor did to accomodate the change.
 *
 * @param {Function} callback
 */
angular.$browser.notifyWhenNoOutstandingRequests = function(callback) {};


/**
 * @typedef {function(string,Array):string}
 */
angular.Filter;


/**
 * @type {function()}
 */
angular.NgModelController.prototype.$$parseAndValidate = function() {};
