goog.declareModuleId('os.ui.ex.AreaExportUI');

/* import KMLExporter from '../../../plugin/file/kml/kmlexporter.js';
import SHPExporter from '../../../plugin/file/shp/shpexporter.js'; */
import {METHOD_FIELD} from '../../interpolate.js';
import {DEFAULT_VECTOR_CONFIG, setFeatureStyle} from '../../style/style.js';
import StyleType from '../../style/styletype.js';
import {Controller as ExportDialogCtrl, directive as exportDialogDirective} from '../file/exportdialog.js';
import Module from '../module.js';
import {create as createWindow} from '../window.js';

const {removeDuplicates} = goog.require('goog.array');

const {default: ExportOptions} = goog.requireType('os.ex.ExportOptions');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * The areaexport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var directive = exportDialogDirective();
  directive.controller = Controller;
  return directive;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'areaexport';

/**
 * Add the directive to the module.
 */
Module.directive('areaexport', [directive]);

/**
 * Controller function for the areaexport directive
 *
 * @extends {ExportDialogCtrl<!VectorSource>}
 * @unrestricted
 */
export class Controller extends ExportDialogCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super($scope, $element, $compile);

    $scope['itemText'] = 'area';

    // Simplify some of the export guis since we dont need most options
    $scope['simple'] = true;

    /**
     * If multiple sources are allowed by the export method.
     * @type {boolean}
     */
    $scope['allowMultiple'] = true;

    // Used for Desktop's 'My Places'
    this.options.items.forEach(function(area) {
      area.set('mapVisualizationType', 'ANNOTATION_REGIONS');
    });
  }

  /**
   * @inheritDoc
   *
   * @suppress {checkTypes|undefinedNames} TODO: remove references to plugin classes from this file! the compiler will
   *                                       will throw errors if they aren't available in the build.
   */
  onExporterChange(opt_new, opt_old) {
    super.onExporterChange(opt_new, opt_old);

    this.options.fields.length = 0;

    var fields = ['name', 'title', 'description', 'tags', METHOD_FIELD];
    /* if (opt_new instanceof KMLExporter) {
      // set the label field for KML and add the mapVisualizationType for Desktop
      opt_new.setDefaultLabelFields(['title']);

      fields.push('mapVisualizationType');
    } else if (opt_new instanceof SHPExporter) {
      // Dont show the ui
      var uiWrapper = this.element.find('.js-export-ui__wrapper');
      uiWrapper.children().remove();
    } */

    // update the export columns
    if (fields && fields.length > 0) {
      this.options.fields = this.options.fields.concat(fields);
    }
  }

  /**
   * Starts the export process for the provided areas.
   *
   * @param {Array<ol.Feature>} areas
   * @param {Array<ol.Feature>=} opt_selected
   * @param {Array<ol.Feature>=} opt_active
   */
  static start(areas, opt_selected, opt_active) {
    if (!areas) {
      areas = [];
    }

    // De-dupe areas
    removeDuplicates(areas);

    // Replace the feature style with the default.
    areas = areas.map(function(area) {
      area = area.clone();
      area.set(StyleType.FEATURE, DEFAULT_VECTOR_CONFIG);
      setFeatureStyle(area);
      return area;
    });

    var title = areas.length == 1 ? areas[0].get('title') : null;
    var scopeOptions = {
      'options': /** @type {ExportOptions} */ ({
        allData: areas,
        selectedData: opt_selected,
        activeData: opt_active,
        additionalOptions: opt_selected || opt_active,
        exporter: null,
        fields: [],
        items: areas,
        persister: null,
        title: title
      })
    };

    var windowOptions = {
      'id': 'areaExport',
      'label': 'Export Areas',
      'icon': 'fa fa-download',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'height': 'auto',
      'show-close': 'true',
      'modal': 'true'
    };

    var template = '<areaexport></areaexport>';
    createWindow(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}
