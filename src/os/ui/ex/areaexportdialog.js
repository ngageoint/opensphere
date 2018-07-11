goog.provide('os.ui.ex.AreaExportCtrl');
goog.provide('os.ui.ex.areaExportDirective');
goog.require('os.ui.Module');
goog.require('os.ui.file.ExportDialogCtrl');
goog.require('os.ui.file.exportDialogDirective');


/**
 * The areaexport directive
 * @return {angular.Directive}
 */
os.ui.ex.areaExportDirective = function() {
  var directive = os.ui.file.exportDialogDirective();
  directive.controller = os.ui.ex.AreaExportCtrl;
  return directive;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('areaexport', [os.ui.ex.areaExportDirective]);



/**
 * Controller function for the areaexport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.file.ExportDialogCtrl.<!os.source.Vector>}
 * @constructor
 * @ngInject
 */
os.ui.ex.AreaExportCtrl = function($scope, $element, $compile) {
  os.ui.ex.AreaExportCtrl.base(this, 'constructor', $scope, $element, $compile);

  $scope['itemText'] = 'area';

  // Simplify some of the export guis since we dont need most options
  $scope['simple'] = true;

  /**
   * If multiple sources are allowed by the export method.
   * @type {boolean}
   */
  $scope['allowMultiple'] = true;

  // Used for Desktop's 'My Places'
  goog.array.forEach(this.options.items, function(area) {
    area.set('mapVisualizationType', 'ANNOTATION_REGIONS');
  });
};
goog.inherits(os.ui.ex.AreaExportCtrl, os.ui.file.ExportDialogCtrl);


/**
 * Starts the export process for the provided areas.
 * @param {Array<ol.Feature>} areas
 */
os.ui.ex.AreaExportCtrl.start = function(areas) {
  if (!areas) {
    areas = [];
  }

  // De-dupe areas
  goog.array.removeDuplicates(areas);

  var title = areas.length == 1 ? areas[0].get('title') : null;
  var scopeOptions = {
    'options': /** @type {os.ex.ExportOptions} */ ({
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
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @inheritDoc
 *
 * @suppress {checkTypes|undefinedNames} TODO: remove references to plugin classes from this file! the compiler will
 *                                       will throw errors if they aren't available in the build.
 */
os.ui.ex.AreaExportCtrl.prototype.onExporterChange = function(opt_new, opt_old) {
  os.ui.ex.AreaExportCtrl.base(this, 'onExporterChange', opt_new, opt_old);

  this.options.fields.length = 0;

  var fields = ['name', 'title', 'description', 'tags', os.interpolate.METHOD_FIELD];
  if (opt_new instanceof plugin.file.kml.KMLExporter) {
    // set the label field for KML and add the mapVisualizationType for Desktop
    opt_new.setDefaultLabelFields(['title']);

    fields.push('mapVisualizationType');
  } else if (opt_new instanceof plugin.file.shp.SHPExporter) {
    // Dont show the ui
    var uiContainer = this.element.find('.export-ui');
    uiContainer.children().remove();
  }

  // update the export columns
  if (fields && fields.length > 0) {
    this.options.fields = this.options.fields.concat(fields);
  }
};
