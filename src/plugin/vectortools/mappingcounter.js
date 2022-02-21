goog.declareModuleId('plugin.vectortools.MappingCounterUI');

import ColumnMappingManager from '../../os/column/columnmappingmanager.js';
import * as os from '../../os/os.js';
import ColumnMappingSettings from '../../os/ui/column/mapping/columnmappingsettings.js';
import * as windows from '../../os/ui/menu/windowsmenu.js';
import Module from '../../os/ui/module.js';
import * as ui from '../../os/ui/ui.js';
import * as vectortools from './vectortools.js';

const EventType = goog.require('goog.events.EventType');
const googObject = goog.require('goog.object');


/**
 * The mappingcounter directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,

  scope: {
    'sourceIds': '='
  },

  templateUrl: os.ROOT + 'views/plugin/vectortools/mappingcounter.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'mappingcounter';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller function for the mappingcounter directive
 * @unrestricted
 */
export class Controller {
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
     * @type {string}
     */
    this['columnMappingHelp'] = 'Column Associations will put data from associated columns on the chosen layers into ' +
        'a single column on the resulting layer. This is useful when the layers you are joining have sparse data ' +
        'of the same type that you wish to analyze together in the resulting layer.';

    /**
     * @type {number}
     */
    this['mappingCount'] = 0;

    this.onColumnMappingsChange_();
    ColumnMappingManager.getInstance()
        .listen(EventType.PROPERTYCHANGE, this.onColumnMappingsChange_, false, this);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    ColumnMappingManager.getInstance()
        .unlisten(EventType.PROPERTYCHANGE, this.onColumnMappingsChange_, false, this);

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Listener for changes to ColumnMappingManager. Recalculates the number of applicable column mappings to the current
   * layers.
   *
   * @private
   */
  onColumnMappingsChange_() {
    this['mappingCount'] = 0;

    var mappings = vectortools.getColumnMappings(this.scope_['sourceIds']);
    for (var key in mappings) {
      var columnsMap = mappings[key];
      this['mappingCount'] += googObject.getCount(columnsMap);
    }

    ui.apply(this.scope_);
  }

  /**
   * Launches the settings window for managing column mappings.
   *
   * @export
   */
  launchColumnMappings() {
    windows.openSettingsTo(ColumnMappingSettings.ID);
  }
}
