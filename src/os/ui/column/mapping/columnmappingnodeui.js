goog.provide('os.ui.column.mapping.ColumnMappingNodeUICtrl');
goog.provide('os.ui.column.mapping.columnMappingNodeUIDirective');
goog.require('os.ui.Module');


/**
 * The selected/highlighted node UI directive for column mappings
 * @return {angular.Directive}
 */
os.ui.column.mapping.columnMappingNodeUIDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<span class="glyphs pull-right slick-node-ui">' +
        '<span ng-click="nodeUi.edit()">' +
        '<i class="fa fa-pencil fa-fw glyph" title="Edit the column mapping"></i></span>' +
        '<span ng-click="nodeUi.tryRemove()">' +
        '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove the column mapping"></i></span>' +
        '</span>',
    controller: os.ui.column.mapping.ColumnMappingNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('columnmappingnodeui', [os.ui.column.mapping.columnMappingNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI for column mappings
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.ColumnMappingNodeUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
};


/**
 * Prompt the user to remove the analytic from the application
 */
os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype.tryRemove = function() {
  var cm = /** @type {os.ui.column.mapping.ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
  var text = 'Are you sure you want to remove the <b>' + cm.getName() + '</b> column association from the ' +
      'application? <b>This action cannot be undone.</b>';

  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: this.remove_.bind(this),
    prompt: text,
    yesText: 'Remove',
    yesIcon: 'fa fa-trash-o',
    yesButtonClass: 'btn-danger',
    windowOptions: {
      'label': 'Remove Column Association',
      'icon': 'fa fa-trash-o',
      'x': 'center',
      'y': 400,
      'width': 325,
      'height': 'auto',
      'modal': 'true',
      'no-scroll': 'true',
      'headerClass': 'bg-danger u-bg-danger-text'
    }
  }));
};
goog.exportProperty(os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype, 'tryRemove',
    os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype.tryRemove);


/**
 * Removes the column mapping
 * @private
 */
os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype.remove_ = function() {
  var cm = /** @type {os.ui.column.mapping.ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
  os.column.ColumnMappingManager.getInstance().remove(cm);
};


/**
 * Edits the column mapping
 */
os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype.edit = function() {
  var cm = /** @type {os.ui.column.mapping.ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
  os.ui.column.mapping.ColumnMappingSettings.launchColumnMappingWindow(cm);
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype,
    'edit',
    os.ui.column.mapping.ColumnMappingNodeUICtrl.prototype.edit);
