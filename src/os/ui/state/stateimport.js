goog.provide('os.ui.state.StateImportCtrl');
goog.provide('os.ui.state.stateImportDirective');

goog.require('goog.object');
goog.require('os.state');
goog.require('os.state.JSONStateOptions');
goog.require('os.state.XMLStateOptions');
goog.require('os.ui.Module');
goog.require('os.ui.clear.ClearManager');
goog.require('os.ui.state.AbstractStateFormCtrl');


/**
 * The stateimport window directive
 * @return {angular.Directive}
 */
os.ui.state.stateImportDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: os.ROOT + 'views/window/stateimportexport.html',
    controller: os.ui.state.StateImportCtrl,
    controllerAs: 'stateForm'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('stateimport', [os.ui.state.stateImportDirective]);



/**
 * Controller for the save state window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.state.AbstractStateFormCtrl}
 * @constructor
 * @ngInject
 */
os.ui.state.StateImportCtrl = function($scope, $element) {
  os.ui.state.StateImportCtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {os.parse.StateParserConfig}
   * @private
   */
  this.config_ = /** @type {os.parse.StateParserConfig} */ ($scope['config']);
  goog.asserts.assert(goog.isDefAndNotNull(this.config_), 'Config not defined for state import UI!');

  // the replace flag should be set when the user chooses to reimport a state. save the current title so the validator
  // can allow it
  if (this.config_['replace']) {
    this.scope['oldTitle'] = this.config_['title'];
  }

  /**
   * @type {Document|Object}
   * @private
   */
  this.rawState_ = /** @type {!(Document|Object)} */ (this.config_['state']);
  goog.asserts.assert(goog.isDefAndNotNull(this.rawState_), 'State doc not defined for state import UI!');

  $scope['title'] = this.config_['title'];
  $scope['description'] = this.config_['description'];
  $scope['tags'] = this.config_['tags'];

  /**
   * @type {!Array.<!os.state.IState>}
   */
  this['states'] = os.ui.stateManager.analyze(this.rawState_);

  /**
   * @type {boolean}
   */
  this['all'] = goog.array.every(this['states'], function(state) {
    return state.getEnabled();
  }, this);

  /**
   * @type {boolean}
   */
  this['showClear'] = goog.object.getCount(os.ui.clearManager.getEntries()) > 0;

  /**
   * @type {boolean}
   */
  this['clear'] = /** @type {boolean} */ (os.settings.get('state.clear', false));

  if (this.config_['loadItems']) {
    // the state file is being reimported, so show which states will be enabled
    this['showOptions'] = true;

    for (var i = 0, n = this['states'].length; i < n; i++) {
      var state = this['states'][i];
      state.setEnabled(goog.array.contains(this.config_['loadItems'], state.toString()));
    }
  }
  $scope.$emit('window.ready');
};
goog.inherits(os.ui.state.StateImportCtrl, os.ui.state.AbstractStateFormCtrl);


/**
 * @inheritDoc
 */
os.ui.state.StateImportCtrl.prototype.onDestroy = function() {
  os.ui.state.StateImportCtrl.base(this, 'onDestroy');
  goog.object.clear(this.config_);
  this.config_ = null;
  this.rawState_ = null;
};


/**
 * @inheritDoc
 */
os.ui.state.StateImportCtrl.prototype.accept = function() {
  if (this['showClear']) {
    os.settings.set('state.clear', this['clear']);
    if (this['clear']) {
      os.ui.clearManager.clear(true);
    }
  }

  var options = null;
  if (this.rawState_ instanceof Document) {
    options = new os.state.XMLStateOptions(/** @type {string} */ (this.scope['title']), this.rawState_);
  } else {
    options = new os.state.JSONStateOptions(/** @type {string} */ (this.scope['title']), this.rawState_);
  }

  options.description = /** @type {?string} */ (this.scope['description']);
  options.states = /** @type {!Array.<!os.state.IState>} */ (this['states']);
  options.tags = /** @type {?string} */ (this.scope['tags']);
  options.load = true;

  os.ui.stateManager.addImportedState(/** @type {!os.file.File} */ (this.config_['file']), options);
  os.ui.state.StateImportCtrl.base(this, 'accept');
};
goog.exportProperty(
    os.ui.state.StateImportCtrl.prototype,
    'accept',
    os.ui.state.StateImportCtrl.prototype.accept);
