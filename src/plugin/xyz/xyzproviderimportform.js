goog.module('plugin.xyz.XYZImportForm');

const Module = goog.require('os.ui.Module');
const {directive: xyzImportDirective} = goog.require('plugin.xyz.XYZImport');
const {ROOT} = goog.require('os');


/**
 * A derivative of the XYZImport directive with the only difference being the templateUrl.
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
const directiveTag = 'xyzproviderform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


exports = {
  directive,
  directiveTag
};
