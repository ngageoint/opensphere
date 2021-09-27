goog.declareModuleId('os.ui.file.ui.csv.ConfigStepUI');

import '../../../spinner.js';
import '../../../wiz/wizardpreview.js';
import {ROOT} from '../../../../os.js';
import Module from '../../../module.js';
import SlickGridEvent from '../../../slick/slickgridevent.js';
import {measureText} from '../../../ui.js';
const {COMMENT_CHARS, DELIMITERS} = goog.require('os.parse.csv');

const CsvParserConfig = goog.requireType('os.parse.csv.CsvParserConfig');


/**
 * The CSV import data step directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/file/csv/configstep.html',
  controller: Controller,
  controllerAs: 'configStep'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'csvconfigstep';


/**
 * Add the directive to the os-ui module
 */
Module.directive('csvconfigstep', [directive]);


/**
 * Controller for the CSV import data step
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * @type {CsvParserConfig}
     * @private
     */
    this.config_ = /** @type {CsvParserConfig} */ ($scope['config']);

    /**
     * @type {Object<string, string>}
     */
    this['delimiters'] = DELIMITERS;

    /**
     * @type {Object<string, string>}
     */
    this['commentChars'] = COMMENT_CHARS;

    /**
     * @type {Array<Object<string, *>>}
     */
    this['linePreviewRows'] = [];

    var maxWidth = 0;
    for (var i = 0, n = this.config_['linePreview'].length; i < n; i++) {
      maxWidth = Math.max(measureText(this.config_['linePreview'][i]).width, maxWidth);
      this['linePreviewRows'].push({
        'id': i + 1,
        'line': this.config_['linePreview'][i]
      });
    }

    /**
     * Line preview columns.
     * @type {Array<Object<string, *>>}
     */
    this['linePreviewColumns'] = [
      {
        'id': 'id',
        'name': 'ID',
        'field': 'id',
        'minWidth': 25,
        'width': 25,
        'resizable': false,
        'selectable': false,
        'sortable': false
      },
      {
        'id': 'line',
        'name': 'Line',
        'field': 'line',
        'selectable': false,
        'sortable': false,
        'width': maxWidth
      }
    ];

    /**
     * Line preview grid options.
     * @type {Object<string, *>}
     */
    this['linePreviewOptions'] = {
      'fullWidthRows': true,
      'multiSelect': false,
      'useRowRenderEvents': true,
      'headerRowHeight': 0,
      'rowHeight': 21
    };

    $scope.$on('headerRow.spinstop', this.scheduleUpdate_.bind(this));
    $scope.$on('dataRow.spinstop', this.scheduleUpdate_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
    this.updatePreview();
  }

  /**
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.config_ = null;
    this.timeout_ = null;
  }

  /**
   * Updates the preview after the next $apply to allow the configuration to update.
   *
   * @private
   */
  scheduleUpdate_() {
    this.timeout_(this.updatePreview.bind(this));
  }

  /**
   * Creates a preview using a subset of the source content.
   *
   * @export
   */
  updatePreview() {
    // don't apply mappings during CSV configuration
    this.config_.updatePreview();

    this.timeout_(this.invalidateGrids.bind(this));
  }

  /**
   * Refresh the child slickgrids
   */
  invalidateGrids() {
    if (this.scope_) {
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_COLUMNS);
    }
  }
}
