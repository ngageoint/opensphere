goog.module('plugin.arc.ArcImportForm');
goog.module.declareLegacyNamespace();

const Controller = goog.require('plugin.arc.GeoserverImportCtrl');
const arcserverDirective = goog.require('plugin.arc.geoserverDirective');
const os = goog.require('os.defines');


const directive = () => {
  const original = arcserverDirective();
  original.templateUrl = os.ROOT + 'views/forms/singleurlform.html';
  return original;
};

Module.directive('arcserverform', [directive]);


exports = {
  Controller,
  directive
};
