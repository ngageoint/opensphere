goog.declareModuleId('os.ui.ex.ExportUI');

import {getAppName} from '../../config/config.js';
import {getExportFields} from '../../source/source.js';
import {Controller as ExportDialogCtrl, directive as exportDialogDirective} from '../file/exportdialog.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import {directiveTag as exportOptionsUi} from './exportoptions.js';
import ExportOptionsEvent from './exportoptionsevent.js';

const {default: ExportOptions} = goog.requireType('os.ex.ExportOptions');
const {default: IExportMethod} = goog.requireType('os.ex.IExportMethod');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * The export directive
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
export const directiveTag = 'export';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the export directive
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

    // call things features in !
    $scope['itemText'] = 'feature';

    // Set the appname to support exporting into the tool.
    this['appName'] = getAppName();

    /**
     * If multiple sources are allowed by the export method.
     * @type {boolean}
     */
    $scope['allowMultiple'] = false;

    /**
     * If time is allowed by the export method.
     * @type {boolean}
     */
    $scope['allowTime'] = false;

    /**
     * If label export is supported by the export method.
     * @type {boolean}
     */
    $scope['showLabels'] = false;

    // initially chosen sources
    var sources = $scope['initSources'] = this.options.sources;

    // if passed multiple sources, try to default to an exporter that supports it
    var scopeEx = /** @type {IExportMethod} */ (this.scope['exporter']);
    if (sources && sources.length > 1 && (!scopeEx || !scopeEx.supportsMultiple())) {
      for (var key in this['exporters']) {
        var exporter = /** @type {IExportMethod} */ (this['exporters'][key]);
        if (exporter.supportsMultiple()) {
          this.scope['exporter'] = exporter;
        }
      }
    }

    $scope.$on(ExportOptionsEvent.CHANGE, this.onExportOptionsChange_.bind(this));
  }

  /**
   * @inheritDoc
   */
  getCustomOptions() {
    return '<h5 class="text-center">Sources to Export</h5>' +
        `<${exportOptionsUi} init-sources="initSources" allow-multiple="allowMultiple" show-labels="showLabels"` +
        ` allow-time="allowTime"></${exportOptionsUi}>`;
  }

  /**
   * @inheritDoc
   */
  onExporterChange(opt_new, opt_old) {
    super.onExporterChange(opt_new, opt_old);

    if (opt_new) {
      this.scope['allowMultiple'] = opt_new.supportsMultiple();
      this.scope['showLabels'] = opt_new.supportsLabelExport();
      this.scope['allowTime'] = opt_new.supportsTime();
    }
  }

  /**
   * Handle changes to the export options.
   *
   * @param {angular.Scope.Event} event The change event
   * @param {Array<!Feature>} items The features to export
   * @param {Array<!VectorSource>} sources The sources to export
   * @private
   */
  onExportOptionsChange_(event, items, sources) {
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
        var sourceFields = getExportFields(sources[i], false, this.scope['allowTime']);
        if (sourceFields) {
          for (var j = 0; j < sourceFields.length; j++) {
            if (!this.options.fields.includes(sourceFields[j])) {
              this.options.fields.push(sourceFields[j]);
            }
          }
        }
      }
    }
  }
}

/**
 * Starts the export process for the provided sources.
 *
 * @param {Array<!VectorSource>=} opt_sources The sources.
 */
export const startExport = function(opt_sources) {
  var sources = opt_sources || [];
  var windowId = 'export';
  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    var title = sources.length == 1 ? sources[0].getTitle() : null;
    var scopeOptions = {
      'options': /** @type {ExportOptions} */ ({
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
      'width': '400',
      'min-width': '300',
      'max-width': '800',
      'height': 'auto',
      'min-height': '250',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = `<${directiveTag}></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
