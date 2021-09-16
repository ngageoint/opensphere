goog.module('plugin.xyz.XYZProviderHelpUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {directive: baseDirective} = goog.require('os.ui.window.BaseWindowUI');


/**
 * Provides help adding an XYZ provider to the application.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const directive = baseDirective();
  directive.templateUrl = ROOT + 'views/plugin/xyz/xyzproviderhelp.html';
  return directive;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'xyzproviderhelp';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


exports = {
  directive,
  directiveTag
};
