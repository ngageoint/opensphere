goog.provide('plugin.vectortools.MappingCounterCtrl');
goog.provide('plugin.vectortools.mappingCounterDirective');

goog.require('os.column.ColumnMappingManager');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.menu.windows');


/**
 * The mappingcounter directive
 * @return {angular.Directive}
 */
plugin.vectortools.mappingCounterDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'sourceIds': '='
    },
    templateUrl: os.ROOT + 'views/plugin/vectortools/mappingcounter.html',
    controller: plugin.vectortools.MappingCounterCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('mappingcounter', [plugin.vectortools.mappingCounterDirective]);



/**
 * Controller function for the mappingcounter directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.vectortools.MappingCounterCtrl = function($scope) {
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
  os.column.ColumnMappingManager.getInstance()
      .listen(goog.events.EventType.PROPERTYCHANGE, this.onColumnMappingsChange_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
plugin.vectortools.MappingCounterCtrl.prototype.destroy_ = function() {
  os.column.ColumnMappingManager.getInstance()
      .unlisten(goog.events.EventType.PROPERTYCHANGE, this.onColumnMappingsChange_, false, this);

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Listener for changes to ColumnMappingManager. Recalculates the number of applicable column mappings to the current
 * layers.
 * @private
 */
plugin.vectortools.MappingCounterCtrl.prototype.onColumnMappingsChange_ = function() {
  this['mappingCount'] = 0;

  var mappings = plugin.vectortools.getColumnMappings(this.scope_['sourceIds']);
  for (var key in mappings) {
    var columnsMap = mappings[key];
    this['mappingCount'] += goog.object.getCount(columnsMap);
  }

  os.ui.apply(this.scope_);
};


/**
 * Launches the settings window for managing column mappings.
 */
plugin.vectortools.MappingCounterCtrl.prototype.launchColumnMappings = function() {
  os.ui.menu.windows.openSettingsTo(os.ui.column.mapping.ColumnMappingSettings.ID);
};
goog.exportProperty(plugin.vectortools.MappingCounterCtrl.prototype,
    'launchColumnMappings',
    plugin.vectortools.MappingCounterCtrl.prototype.launchColumnMappings);
