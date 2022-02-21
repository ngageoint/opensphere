goog.declareModuleId('plugin.im.action.feature.ui.SoundConfigUI');

import '../../../os/ui/popover/popover.js';
import '../../../os/ui/spinner.js';
import AudioManager from '../../../os/audio/audiomanager.js';
import * as osObject from '../../../os/object/object.js';
import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import ActionConfigCtrl from './featureactionconfig.js';

/**
 * Directive to configure a feature style action.
 *
 * @return {angular.Directive}
 *
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/featureaction/featuresoundactionconfig.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureactionsoundconfig';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for setting a feature sound.
 *
 * @extends {ActionConfigCtrl<SoundAction>}
 * @unrestricted
 */
export class Controller extends ActionConfigCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    $scope.$on('playDelay.spinstop', this.onDelayChange.bind(this));

    this['sounds'] = AudioManager.getInstance().getSounds();

    if (this.action && this.action.soundConfig) {
      this.soundConfig = /** @type {!Object} */ (osObject.unsafeClone(this.action.soundConfig));
    } else {
      this.soundConfig = /** @type {!Object} */ (osObject.unsafeClone(defaultConfig));
    }

    this.initialize();
  }

  /**
   * @inheritDoc
   */
  initialize() {
    super.initialize();
    this.scope['playDelay'] = this.soundConfig['playDelay'];
    this['sound'] = this.soundConfig['sound'];
    this['help'] = 'Set the time between sound notifications in seconds';
  }

  /**
   * @inheritDoc
   */
  saveAction() {
    if (this.action && this.soundConfig) {
      this.action.soundConfig = this.soundConfig;
    }
  }

  /**
   * Play selected sound on change and save.
   *
   * @export
   */
  onSoundChange() {
    var snd = this['sound'];
    AudioManager.getInstance().play(snd);
    this.soundConfig['sound'] = this['sound'];
  }

  /**
   * Set the time between sound notifications.
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onDelayChange(event, value) {
    event.stopPropagation();

    if (this.soundConfig && value != null) {
      this.soundConfig['playDelay'] = value;
    }
  }
}

/**
 * The default config for the action.
 * @type {!Object}
 */
let defaultConfig = {};


/**
 * Set the default config for the action.
 * @param {!Object} config The config.
 */
export const setDefaultConfig = (config) => {
  defaultConfig = config;
};
