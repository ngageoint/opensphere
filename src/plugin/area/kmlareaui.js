goog.module('plugin.area.KMLAreaUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.im.mergeAreaOptionDirective');

const {ROOT} = goog.require('os');
const Importer = goog.require('os.im.Importer');
const AreaImportCtrl = goog.require('plugin.area.AreaImportCtrl');
const KMLAreaParser = goog.require('plugin.area.KMLAreaParser');

const FileParserConfig = goog.requireType('os.parse.FileParserConfig');


/**
 * The KML area import directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/kml/kmlarea.html',
  controller: Controller,
  controllerAs: 'areaFiles'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'kmlarea';


/**
 * Add the directive to the module
 */
os.ui.Module.directive('kmlarea', [directive]);



/**
 * Controller for the SHP import file selection step
 *
 * @extends {AreaImportCtrl<FileParserConfig>}
 * @unrestricted
 */
class Controller extends AreaImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
  }

  /**
   * @inheritDoc
   * @export
   */
  finish() {
    super.finish();

    var parser = new KMLAreaParser();
    var importer = new Importer(parser);
    importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);
    importer.startImport(this.config['file'].getContent());
  }

  /**
   * @inheritDoc
   */
  getFileName() {
    return this.config['file'] && this.config['file'].getFileName() || undefined;
  }

  /**
   * Success callback for importing data. Adds the areas to Area Manager
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var importer = /** @type {Importer} */ (event.target);
    var features = /** @type {!Array<ol.Feature>} */ (importer.getData() || []);
    importer.dispose();

    this.processFeatures(features);
    this.close();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
