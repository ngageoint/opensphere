goog.module('plugin.ogc.ui.OgcServerImportForm');
goog.module.declareLegacyNamespace();

const Controller = goog.require('plugin.ogc.ui.OgcServerImportCtrl');
const ogcserverDirective = goog.require('plugin.ogc.ui.ogcserverDirective');
const os = goog.require('os.defines');


const directive = () => {
  const original = ogcserverDirective();
  original.templateUrl = os.ROOT + 'views/plugin/ogc/ui/ogcserverimportform.html';
  return original;
};

Module.directive('ogcserverform', [directive]);


exports = {
  Controller,
  directive
};
