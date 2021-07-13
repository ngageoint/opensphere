goog.module('plugin.file.kml.ui.KMLExportUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.icon.iconPickerDirective');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const kml = goog.require('os.ui.file.kml');

const AbstractKMLExporter = goog.requireType('os.ui.file.kml.AbstractKMLExporter');


/**
 * The kmlexport directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',

  scope: {
    'exporter': '=',
    'simple': '=?'
  },

  templateUrl: ROOT + 'views/plugin/kml/kmlexport.html',
  controller: Controller,
  controllerAs: 'kmlexport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'kmlexport';


/**
 * Add the directive to the module.
 */
Module.directive('kmlexport', [directive]);



/**
 * Controller function for the kmlexport directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {AbstractKMLExporter}
     * @private
     */
    this.exporter_ = /** @type {AbstractKMLExporter} */ ($scope['exporter']);

    /**
     * @type {!osx.icon.Icon}
     */
    this['icon'] = /** @type {!osx.icon.Icon} */ ({// kml.Icon to osx.icon.Icon
      path: this.exporter_.getDefaultIcon() ? this.exporter_.getDefaultIcon().href : kml.getDefaultIcon().path,
      options: this.exporter_.getDefaultIcon() ?
        this.exporter_.getDefaultIcon().options : kml.getDefaultIcon().options
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
    this['exportRangeRings'] = this.exporter_.getExportRangeRings();

    /**
     * @type {string}
     */
    this['rangeRingHelp'] = 'Range Rings are a Place style specific to this application. Enabling this option ' +
        'will export them as polygon geometries for other applications, but they will lose data (such as labels). ' +
        'To export them with this data, use the "Export Places" menu item or export from the Places pane.';

    /**
     * @type {boolean}
     */
    this['useCenterPoint'] = this.exporter_.getUseCenterPoint();

    /**
     * Icons available to the icon picker.
     * @type {!Array<!osx.icon.Icon>}
     */
    this['iconSet'] = kml.GOOGLE_EARTH_ICON_SET;

    /**
     * Function to translate image sources from the icon set.
     * @type {function(string):string}
     */
    this['iconSrc'] = kml.replaceGoogleUri;

    $scope.$watch('kmlexport.icon.path', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.useItemColor', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.useItemIcon', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.compress', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.exportEllipses', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.exportRangeRings', this.updateExporter_.bind(this));
    $scope.$watch('kmlexport.useCenterPoint', this.updateExporter_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));

    this.updateExporter_();
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.exporter_ = null;
  }

  /**
   * Updates the KML exporter with the current UI configuration.
   *
   * @private
   */
  updateExporter_() {
    if (this.exporter_ && this.scope_) {
      this.exporter_.setUseItemColor(this['useItemColor']);
      this.exporter_.setUseItemIcon(this['useItemIcon']);
      this.exporter_.setCompress(this['compress']);
      this.exporter_.setExportEllipses(this['exportEllipses']);
      this.exporter_.setExportRangeRings(this['exportRangeRings']);
      this.exporter_.setUseCenterPoint(this['useCenterPoint']);
      if (this['icon']) {
        var kmlIcon = {// osx.icon.Icon to kml.Icon
          'href': kml.exportableIconUri(this['icon']['path']),
          'options': this['icon']['options']
        };
        this.exporter_.setIcon(kmlIcon);
      }
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
