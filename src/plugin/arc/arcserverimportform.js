goog.module('plugin.arc.ArcImportForm');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const Controller = goog.require('plugin.arc.ArcImportCtrl');
const arcserverDirective = goog.require('plugin.arc.arcImportDirective');
const {ROOT} = goog.require('os');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = arcserverDirective();
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
  Controller,
  directive,
  directiveTag
};
