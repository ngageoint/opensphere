goog.provide('os.ui.state.StateExportCtrl');
goog.provide('os.ui.state.stateExportDirective');

goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.ui.Module');
goog.require('os.ui.state');
goog.require('os.ui.state.AbstractStateFormCtrl');


/**
 * The stateexport window directive
 * @return {angular.Directive}
 */
os.ui.state.stateExportDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: os.ROOT + 'views/window/stateimportexport.html',
    controller: os.ui.state.StateExportCtrl,
    controllerAs: 'stateForm'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('stateexport', [os.ui.state.stateExportDirective]);



/**
 * Controller for the save export window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.state.AbstractStateFormCtrl}
 * @constructor
 * @ngInject
 */
os.ui.state.StateExportCtrl = function($scope, $element, $timeout) {
  os.ui.state.StateExportCtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {string|undefined}
   */
  this['appName'] = os.config.getAppName();

  /**
   * @type {?string}
   */
  this['persister'] = null;

  var persisters = os.ui.file.ExportManager.getInstance().getPersistenceMethods();
  if (persisters && persisters.length > 0) {
    for (var i = 0, n = persisters.length; i < n; i++) {
      this['persisters'][persisters[i].getLabel()] = persisters[i];
    }
  }

  var defaultMethod = /** @type {string|undefined} */ ($scope['defaultMethod']) || 'File';
  if (defaultMethod && defaultMethod in this['persisters']) {
    this['persister'] = this['persisters'][defaultMethod];
  }

  /**
   * @type {Array.<os.state.IState>}
   */
  this['states'] = os.ui.stateManager.getAvailable();

  /**
   * @type {boolean}
   */
  this['all'] = goog.array.every(this['states'], function(state) {
    return state.getEnabled();
  }, this);

  /**
   * @type {boolean}
   */
  this['isSaving'] = true;
  $timeout(function() {
    $scope.$emit('window.ready');
  });
};
goog.inherits(os.ui.state.StateExportCtrl, os.ui.state.AbstractStateFormCtrl);


/**
 * @inheritDoc
 */
os.ui.state.StateExportCtrl.prototype.accept = function() {
  var method = this['persister'] || null;
  var title = /** @type {string} */ (this.scope['title']);
  var description = /** @type {string|undefined} */ (this.scope['description']);
  var tags = /** @type {string|undefined} */ (this.scope['tags']);
  var states;

  if (this['states'] && this['states'].length > 0) {
    states = [];

    for (var i = 0, n = this['states'].length; i < n; i++) {
      var state = this['states'][i];
      if (state.getEnabled()) {
        states.push(state);
      }
    }
  }
  os.ui.stateManager.saveStates(method, title, description, tags, states);

  os.ui.state.StateExportCtrl.base(this, 'accept');
};
goog.exportProperty(
    os.ui.state.StateExportCtrl.prototype,
    'accept',
    os.ui.state.StateExportCtrl.prototype.accept);
