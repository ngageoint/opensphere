goog.module('plugin.ogc.ui.OgcServerImportForm');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {directive: ogcServerDirective} = goog.require('plugin.ogc.ui.OgcServerImportUI');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = ogcServerDirective();
  original.templateUrl = ROOT + 'views/plugin/ogc/ui/ogcserverimportform.html';
  return original;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'ogcserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


exports = {
  directive,
  directiveTag
};
