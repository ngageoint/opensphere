goog.module('plugin.ogc.ui.GeoserverImportForm');
goog.module.declareLegacyNamespace();

const Controller = goog.require('plugin.ogc.ui.GeoserverImportCtrl');
const geoserverDirective = goog.require('plugin.ogc.ui.geoserverDirective');
const os = goog.require('os.defines');


const directive = () => {
  const original = geoserverDirective();
  original.templateUrl = os.ROOT + 'views/forms/singleurlform.html';
  return original;
};

Module.directive('geoserverform', [directive]);


exports = {
  Controller,
  directive
};
