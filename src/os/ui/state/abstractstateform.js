goog.provide('os.ui.state.AbstractStateFormCtrl');
goog.require('os.ui.state.stateTitleDirective');
goog.require('os.ui.window');



/**
 * Abstract controller for state forms.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.state.AbstractStateFormCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * ng-model to toggle all states on/off
   * @type {boolean}
   */
  this['all'] = false;

  /**
   * @type {os.ex.IPersistenceMethod}
   */
  this['persister'] = null;

  /**
   * @type {Object.<string, os.ex.IPersistenceMethod>}
   */
  this['persisters'] = {};

  /**
   * ng-model for the 'Choose which parts to import/save' checkbox
   * @type {boolean}
   */
  this['showOptions'] = false;

  /**
   * states to show in the chooser
   * @type {Array.<os.state.IState>}
   */
  this['states'] = [];

  /**
   * if this is a form to save state - determines language used in the form
   * @type {boolean}
   */
  this['isSaving'] = false;

  $scope.$on('$destroy', this.onDestroy.bind(this));
};


/**
 * Clean up references/listeners.
 *
 * @protected
 */
os.ui.state.AbstractStateFormCtrl.prototype.onDestroy = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Save the state
 *
 * @export
 */
os.ui.state.AbstractStateFormCtrl.prototype.accept = function() {
  this.close();
};


/**
 * Close the window
 *
 * @export
 */
os.ui.state.AbstractStateFormCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Toggle all options
 *
 * @export
 */
os.ui.state.AbstractStateFormCtrl.prototype.toggleAll = function() {
  for (var i = 0, n = this['states'].length; i < n; i++) {
    this['states'][i].setEnabled(this['all']);
  }
};


/**
 * Get the state's description.
 *
 * @param {os.state.IState} state The state
 * @return {string} The description
 * @export
 */
os.ui.state.AbstractStateFormCtrl.prototype.getDescription = function(state) {
  var description = state.getDescription();
  if (!this['isSaving']) {
    description = description.replace('Saves', 'Sets');
  }

  return description;
};


/**
 * Get the state's title.
 *
 * @param {os.state.IState} state The state
 * @return {string} The title
 * @export
 */
os.ui.state.AbstractStateFormCtrl.prototype.getTitle = function(state) {
  return state.getTitle();
};
