goog.module('plugin.arc.ArcImportForm');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {directive: arcServerDirective} = goog.require('plugin.arc.ArcImportUI');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = arcServerDirective();
  original.templateUrl = ROOT + 'views/forms/singleurlform.html';
  return original;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'arcserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


exports = {
  directive,
  directiveTag
};
