goog.provide('os.ui.columnactions.ColumnActionsCtrl');
goog.provide('os.ui.columnactions.columnActionPromptDirective');
goog.provide('os.ui.columnactions.launchColumnActionPrompt');

goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.columnactions.IColumnActionModel');


/**
 * Dialog used when a user tries importing a duplicate file.
 * @return {angular.Directive}
 */
os.ui.columnactions.columnActionPromptDirective = function() {
  return {
    restrict: 'E',
    transclude: true,
    templateUrl: os.ROOT + 'views/columnactions/columnactionprompt.html',
    controller: os.ui.columnactions.ColumnActionsCtrl,
    controllerAs: 'columnActionPrompt'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('columnactions', [os.ui.columnactions.columnActionPromptDirective]);



/**
 * Controller for the File Exists! window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.columnactions.ColumnActionsCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;


  this['matched'] = this.scope_['matched'];


  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.columnactions.ColumnActionsCtrl.prototype.onDestroy_ = function() {
  this.element_ = null;
  this.scope_ = null;
};


/**
 *
 * @param {Object} match
 * @param {string} value
 * @private
 */
os.ui.columnactions.ColumnActionsCtrl.prototype.executeMatch_ = function(match, value) {
  match.execute(value);
};
goog.exportProperty(os.ui.columnactions.ColumnActionsCtrl.prototype, 'executeMatch',
    os.ui.columnactions.ColumnActionsCtrl.prototype.executeMatch_);


/**
 *
 * @param {Object} match
 * @return {string}
 * @private
 */
os.ui.columnactions.ColumnActionsCtrl.prototype.getDescription_ = function(match) {
  return match.getDescription();
};
goog.exportProperty(os.ui.columnactions.ColumnActionsCtrl.prototype, 'getDescription',
    os.ui.columnactions.ColumnActionsCtrl.prototype.getDescription_);


/**
 * Close the window.
 * @private
 */
os.ui.columnactions.ColumnActionsCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(os.ui.columnactions.ColumnActionsCtrl.prototype, 'close',
    os.ui.columnactions.ColumnActionsCtrl.prototype.close_);


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 * @param {Array.<os.ui.columnactions.AbstractColumnAction>} matched
 * @param {*} value from the column
 * @param {os.ui.columnactions.IColumnActionModel} colDef
 */
os.ui.columnactions.launchColumnActionPrompt = function(matched, value, colDef) {
  var scopeOptions = {
    'matched': matched,
    'colDef': colDef,
    'value': value,
    'doneText': 'Close',
    'doneIcon': 'fa fa-check icon-blue'
  };

  var windowOptions = {
    'label': goog.string.buildString('Select a Column Action for ', colDef.getTitle(), ' = ', value),
    'icon': 'fa fa-action',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'height': '350',
    'modal': 'true',
    'show-close': 'true',
    'no-scroll': 'true'
  };

  var template = '<columnactions class="d-flex flex-fill"></columnactions>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
