goog.declareModuleId('os.ui.state.StateImport');

import {ROOT} from '../../os.js';
import ClearManager from '../clear/clearmanager.js';
import Module from '../module.js';
import WindowEventType from '../windoweventtype.js';
import AbstractStateFormCtrl from './abstractstateform.js';

const {assert} = goog.require('goog.asserts');
const {clear, getCount} = goog.require('goog.object');
const Settings = goog.require('os.config.Settings');
const JSONStateOptions = goog.require('os.state.JSONStateOptions');
const XMLStateOptions = goog.require('os.state.XMLStateOptions');
const {getStateManager} = goog.require('os.state.instance');

const OSFile = goog.requireType('os.file.File');
const StateParserConfig = goog.requireType('os.parse.StateParserConfig');


const IState = goog.requireType('os.state.IState');


/**
 * The stateimport window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/window/stateimportexport.html',
  controller: Controller,
  controllerAs: 'stateForm'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'stateimport';

/**
 * Add the directive to the os.ui module
 */
Module.directive('stateimport', [directive]);

/**
 * Controller for the save state window
 * @unrestricted
 */
export class Controller extends AbstractStateFormCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element);

    /**
     * @type {StateParserConfig}
     * @private
     */
    this.config_ = /** @type {StateParserConfig} */ ($scope['config']);
    assert(this.config_ != null, 'Config not defined for state import UI!');

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
    assert(this.rawState_ != null, 'State doc not defined for state import UI!');

    $scope['title'] = this.config_['title'];
    $scope['description'] = this.config_['description'];
    $scope['tags'] = this.config_['tags'];

    /**
     * @type {!Array<!IState>}
     */
    this['states'] = getStateManager().analyze(this.rawState_);

    /**
     * @type {boolean}
     */
    this['all'] = this['states'].every(function(state) {
      return state.getSupported() ? state.getEnabled() : true;
    }, this);

    /**
     * @type {boolean}
     */
    this['showClear'] = getCount(ClearManager.getInstance().getEntries()) > 0;

    /**
     * @type {boolean}
     */
    this['clear'] = /** @type {boolean} */ (Settings.getInstance().get('state.clear', false));

    if (this.config_['loadItems']) {
      // the state file is being reimported, so show which states will be enabled
      this['showOptions'] = true;

      for (var i = 0, n = this['states'].length; i < n; i++) {
        var state = this['states'][i];
        state.setEnabled(this.config_['loadItems'].includes(state.toString()));
      }
    }
    $timeout(() => $scope.$emit(WindowEventType.READY));
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();
    clear(this.config_);
    this.config_ = null;
    this.rawState_ = null;
  }

  /**
   * @inheritDoc
   * @export
   */
  accept() {
    if (this['showClear']) {
      Settings.getInstance().set('state.clear', this['clear']);
      if (this['clear']) {
        ClearManager.getInstance().clear(true, ['mapPosition']);
      }
    }

    var options = null;
    if (this.rawState_ instanceof Document) {
      options = new XMLStateOptions(/** @type {string} */ (this.scope['title']), this.rawState_);
    } else {
      options = new JSONStateOptions(/** @type {string} */ (this.scope['title']), this.rawState_);
    }

    options.description = /** @type {?string} */ (this.scope['description']);
    options.states = /** @type {!Array<!IState>} */ (this['states']);
    options.tags = /** @type {?string} */ (this.scope['tags']);
    options.load = true;

    getStateManager().addImportedState(/** @type {!OSFile} */ (this.config_['file']), options);
    super.accept();
  }
}
