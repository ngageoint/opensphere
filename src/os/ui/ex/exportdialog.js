goog.provide('os.ui.ex.ExportCtrl');
goog.provide('os.ui.ex.ExportDirective');

goog.require('goog.array');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.events.SelectionType');
goog.require('os.feature');
goog.require('os.source');
goog.require('os.source.PropertyChange');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.ex.exportOptionsDirective');
goog.require('os.ui.file.ExportDialogCtrl');
goog.require('os.ui.file.exportDialogDirective');
goog.require('os.ui.window');


/**
 * The export directive
 * @return {angular.Directive}
 */
os.ui.ex.ExportDirective = function() {
  var directive = os.ui.file.exportDialogDirective();
  directive.controller = os.ui.ex.ExportCtrl;
  return directive;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('export', [os.ui.ex.ExportDirective]);



/**
 * Controller function for the export directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.file.ExportDialogCtrl<!os.source.Vector>}
 * @constructor
 * @ngInject
 */
os.ui.ex.ExportCtrl = function($scope, $element, $compile) {
  os.ui.ex.ExportCtrl.base(this, 'constructor', $scope, $element, $compile);

  // call things features in !
  $scope['itemText'] = 'feature';

  /**
   * If multiple sources are allowed by the export method.
   * @type {boolean}
   */
  $scope['allowMultiple'] = false;

  /**
   * If label export is supported by the export method.
   * @type {boolean}
   */
  $scope['showLabels'] = false;

  // initially chosen sources
  var sources = $scope['initSources'] = this.options.sources;

  // if passed multiple sources, try to default to an exporter that supports it
  var scopeEx = /** @type {os.ex.IExportMethod} */ (this.scope['exporter']);
  if (sources && sources.length > 1 && (!scopeEx || !scopeEx.supportsMultiple())) {
    for (var key in this['exporters']) {
      var exporter = /** @type {os.ex.IExportMethod} */ (this['exporters'][key]);
      if (exporter.supportsMultiple()) {
        this.scope['exporter'] = exporter;
      }
    }
  }

  $scope.$on(os.ui.ex.ExportOptionsEvent.CHANGE, this.onExportOptionsChange_.bind(this));
};
goog.inherits(os.ui.ex.ExportCtrl, os.ui.file.ExportDialogCtrl);


/**
 * @inheritDoc
 */
os.ui.ex.ExportCtrl.prototype.getCustomOptions = function() {
  return '<h6>Sources to Export</h6>' +
      '<exportoptions init-sources="initSources" allow-multiple="allowMultiple" show-labels="showLabels">' +
      '</exportoptions>';
};


/**
 * @inheritDoc
 */
os.ui.ex.ExportCtrl.prototype.onExporterChange = function(opt_new, opt_old) {
  os.ui.ex.ExportCtrl.base(this, 'onExporterChange', opt_new, opt_old);

  if (opt_new) {
    this.scope['allowMultiple'] = opt_new.supportsMultiple();
    this.scope['showLabels'] = opt_new.supportsLabelExport();
  }
};


/**
 * Handle changes to the export options.
 * @param {angular.Scope.Event} event The change event
 * @param {Array<!ol.Feature>} items The features to export
 * @param {Array<!os.source.Vector>} sources The sources to export
 * @private
 */
os.ui.ex.ExportCtrl.prototype.onExportOptionsChange_ = function(event, items, sources) {
  event.stopPropagation();

  this.options.items.length = 0;
  this.options.fields.length = 0;

  // update the export items
  if (items && items.length > 0) {
    this.options.items = this.options.items.concat(items);
  }

  // update the export columns
  if (sources) {
    for (var i = 0; i < sources.length; i++) {
      var sourceFields = os.source.getExportFields(sources[i]);
      if (sourceFields) {
        for (var j = 0; j < sourceFields.length; j++) {
          if (!goog.array.contains(this.options.fields, sourceFields[j])) {
            this.options.fields.push(sourceFields[j]);
          }
        }
      }
    }
  }
};


/**
 * Starts the export process for the provided sources.
 * @param {Array<!os.source.Vector>=} opt_sources The sources.
 */
os.ui.ex.startExport = function(opt_sources) {
  var sources = opt_sources || [];
  var windowId = 'export';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var title = sources.length == 1 ? sources[0].getTitle() : null;
    var scopeOptions = {
      'options': /** @type {os.ex.ExportOptions} */ ({
        exporter: null,
        fields: [],
        items: [],
        persister: null,
        sources: sources,
        title: title
      })
    };

    var windowOptions = {
      'id': windowId,
      'label': 'Export Data',
      'icon': 'fa fa-download',
      'x': 'center',
      'y': 'center',
      'width': '350',
      'min-width': '300',
      'max-width': '800',
      'height': '400',
      'min-height': '250',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = '<export></export>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
