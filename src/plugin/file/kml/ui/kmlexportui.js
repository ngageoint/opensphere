goog.provide('plugin.file.kml.ui.KMLExportCtrl');
goog.provide('plugin.file.kml.ui.kmlExportDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.file.kml');
goog.require('os.ui.icon.IconPickerCtrl');
goog.require('os.ui.icon.iconPickerDirective');


/**
 * The kmlexport directive
 * @return {angular.Directive}
 */
plugin.file.kml.ui.kmlExportDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'exporter': '=',
      'simple': '=?'
    },
    templateUrl: os.ROOT + 'views/plugin/kml/kmlexport.html',
    controller: plugin.file.kml.ui.KMLExportCtrl,
    controllerAs: 'kmlexport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('kmlexport', [plugin.file.kml.ui.kmlExportDirective]);



/**
 * Controller function for the kmlexport directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.file.kml.ui.KMLExportCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.ui.file.kml.AbstractKMLExporter}
   * @private
   */
  this.exporter_ = /** @type {os.ui.file.kml.AbstractKMLExporter} */ ($scope['exporter']);

  /**
   * @type {!osx.icon.Icon}
   */
  this['icon'] = /** @type {!osx.icon.Icon} */ ({ // os.ui.file.kml.Icon to osx.icon.Icon
    path: this.exporter_.getDefaultIcon() ? this.exporter_.getDefaultIcon().href : os.ui.file.kml.getDefaultIcon().path
  });

  /**
   * @type {boolean}
   */
  this['useItemColor'] = this.exporter_.getUseItemColor();

  /**
   * @type {boolean}
   */
  this['useItemIcon'] = this.exporter_.getUseItemIcon();

  /**
   * @type {boolean}
   */
  this['compress'] = this.exporter_.getCompress();

  /**
   * @type {boolean}
   */
  this['exportEllipses'] = this.exporter_.getExportEllipses();

  /**
   * @type {boolean}
   */
  this['useCenterPoint'] = this.exporter_.getUseCenterPoint();

  /**
   * Icons available to the icon picker.
   * @type {!Array<!osx.icon.Icon>}
   */
  this['iconSet'] = os.ui.file.kml.GOOGLE_EARTH_ICON_SET;

  /**
   * Function to translate image sources from the icon set.
   * @type {function(string):string}
   */
  this['iconSrc'] = os.ui.file.kml.replaceGoogleUri;

  $scope.$watch('kmlexport.icon.path', this.updateExporter_.bind(this));
  $scope.$watch('kmlexport.useItemColor', this.updateExporter_.bind(this));
  $scope.$watch('kmlexport.useItemIcon', this.updateExporter_.bind(this));
  $scope.$watch('kmlexport.compress', this.updateExporter_.bind(this));
  $scope.$watch('kmlexport.exportEllipses', this.updateExporter_.bind(this));
  $scope.$watch('kmlexport.useCenterPoint', this.updateExporter_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.updateExporter_();
};


/**
 * Clean up.
 * @private
 */
plugin.file.kml.ui.KMLExportCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.exporter_ = null;
};


/**
 * Updates the KML exporter with the current UI configuration.
 * @private
 */
plugin.file.kml.ui.KMLExportCtrl.prototype.updateExporter_ = function() {
  if (this.exporter_ && this.scope_) {
    this.exporter_.setUseItemColor(this['useItemColor']);
    this.exporter_.setUseItemIcon(this['useItemIcon']);
    this.exporter_.setCompress(this['compress']);
    this.exporter_.setExportEllipses(this['exportEllipses']);
    this.exporter_.setUseCenterPoint(this['useCenterPoint']);
    if (this['icon']) {
      var kmlIcon = { // osx.icon.Icon to os.ui.file.kml.Icon
        'href': this['icon']['path']
      };
      this.exporter_.setIcon(kmlIcon);
    }
  }
};
