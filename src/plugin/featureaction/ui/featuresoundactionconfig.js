goog.module('plugin.im.action.feature.ui.SoundConfigUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.popover.PopoverUI');
goog.require('os.ui.spinnerDirective');

const {ROOT} = goog.require('os');
const AudioManager = goog.require('os.audio.AudioManager');
const osObject = goog.require('os.object');
const Module = goog.require('os.ui.Module');
const ActionConfigCtrl = goog.require('plugin.im.action.feature.ui.ActionConfigCtrl');

const SoundAction = goog.requireType('plugin.im.action.feature.SoundAction');


/**
 * Directive to configure a feature style action.
 *
 * @return {angular.Directive}
 *
 */
const directive = () => ({
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
const directiveTag = 'featureactionsoundconfig';


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
class Controller extends ActionConfigCtrl {
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
const setDefaultConfig = (config) => {
  defaultConfig = config;
};

exports = {
  Controller,
  directive,
  directiveTag,
  setDefaultConfig
};
