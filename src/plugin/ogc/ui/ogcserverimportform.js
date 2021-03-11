goog.module('plugin.ogc.ui.OgcServerImportForm');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const Controller = goog.require('plugin.ogc.ui.OgcServerImportCtrl');
const ogcserverDirective = goog.require('plugin.ogc.ui.ogcserverDirective');
const {ROOT} = goog.require('os');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = ogcserverDirective();
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
  Controller,
  directive,
  directiveTag
};
