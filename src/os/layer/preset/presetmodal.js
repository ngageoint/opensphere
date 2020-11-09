goog.module('os.layer.preset.PresetModal');

const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const Module = goog.require('os.ui.Module');

/**
 * The controller for the preset directive; make use of the MenuButtonController
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {Object<string, ?>}
     */
    this.params = $scope['params'];

    /**
     * @type {osx.layer.Preset}
     */
    this['local'] = Object.assign({}, $scope['params']['preset']); // copy the scope preset so we can edit it locally

    /**
     * @type {boolean}
     */
    this['thinking'] = false;

    this.init_();
  }

  /**
   * @private
   */
  init_() {
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.params = null;
    this['local'] = null;
  }

  /**
   * Run the save through the implementing ipresetservice
   */
  save() {
    const lpm = LayerPresetManager.getInstance();
    const service = lpm.service();
    if (service != null) {
      if (this['local']['id']) {
        service.update(this['local']);
      } else {
        service.insert(this['local']);
      }
    }
  }

  /**
   * Create a new Preset if there's no ID
   */
  toggleSaveAs() {
    if (!this['local']['id']) {
      this['local']['id'] = this.params['preset']['id'];
    } else {
      this['local']['id'] = null;
    }
  }
}

/**
 * The preset directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'params': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  templateUrl: os.ROOT + 'views/layer/preset/presetmodal.html'
});


/**
 * Add the directive to the module.
 */
Module.directive('presetModal', [directive]);


exports = {directive, Controller};
