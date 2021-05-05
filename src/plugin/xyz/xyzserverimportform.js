goog.module('plugin.xyz.XYZImportForm');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const {directive: xyzImportDirective} = goog.require('plugin.xyz.XYZImport');
const {ROOT} = goog.require('os');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = xyzImportDirective();
  original.templateUrl = ROOT + 'views/plugin/xyz/xyzsingleurlform.html';
  return original;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'xyzserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


exports = {
  directive,
  directiveTag
};
