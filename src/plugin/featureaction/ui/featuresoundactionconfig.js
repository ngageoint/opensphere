goog.provide('plugin.im.action.feature.ui.SoundConfigCtrl');
goog.provide('plugin.im.action.feature.ui.soundConfigDirective');

goog.require('os.audio.AudioManager');
goog.require('os.object');
goog.require('os.ui.Module');
goog.require('os.ui.im.action.EventType');
goog.require('os.ui.spinnerDirective');
goog.require('os.ui.uiSwitchDirective');
goog.require('plugin.im.action.feature.SoundAction');
goog.require('plugin.im.action.feature.ui.ActionConfigCtrl');

/**
 * Directive to configure a feature style action.
 * @return {angular.Directive}
 *
 */
plugin.im.action.feature.ui.soundConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/featureaction/featuresoundactionconfig.html',
    controller: plugin.im.action.feature.ui.SoundConfigCtrl,
    controllerAs: 'ctrl'
  };
};

/**
 * Add the directive to the module.
 */
os.ui.Module.directive(plugin.im.action.feature.SoundAction.CONFIG_UI,
    [plugin.im.action.feature.ui.soundConfigDirective]);

/**
 * Controller for setting a feature sound.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {plugin.im.action.feature.ui.ActionConfigCtrl<plugin.im.action.feature.SoundAction>}
 * @constructor
 * @ngInject
 */
plugin.im.action.feature.ui.SoundConfigCtrl = function($scope, $element) {
  plugin.im.action.feature.ui.SoundConfigCtrl.base(this, 'constructor', $scope,
      $element);
  $scope.$on('playDelay.spinstop', this.onDelayChange.bind(this));

  this['sounds'] = os.audio.AudioManager.getInstance().getSounds();

  if (this.action && this.action.soundConfig) {
    this.soundConfig = /** @type {!Object} */ (os.object.unsafeClone(
        this.action.soundConfig));
  } else {
    this.soundConfig = /** @type {!Object} */ (os.object.unsafeClone(
        plugin.im.action.feature.SoundAction.DEFAULT_CONFIG));
  }

  this.initialize();
};
goog.inherits(plugin.im.action.feature.ui.SoundConfigCtrl,
    plugin.im.action.feature.ui.ActionConfigCtrl);

/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.SoundConfigCtrl.prototype.initialize = function() {
  plugin.im.action.feature.ui.SoundConfigCtrl.base(this, 'initialize');
  this.scope['playDelay'] = this.soundConfig['playDelay'];
  this['sound'] = this.soundConfig['sound'];
  this['help'] = 'Set the time between sound notifications in seconds';
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.SoundConfigCtrl.prototype.saveAction = function() {
  if (this.action && this.soundConfig) {
    this.action.soundConfig = this.soundConfig;
  }
};

/**
 * Play selected sound on change and save.
 */
plugin.im.action.feature.ui.SoundConfigCtrl.prototype.onSoundChange = function() {
  var snd = this['sound'];
  os.audio.AudioManager.getInstance().play(snd);
  this.soundConfig['sound'] = this['sound'];
};

/**
 * Set the time between sound notifications.
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.im.action.feature.ui.SoundConfigCtrl.prototype.onDelayChange = function(event, value) {
  event.stopPropagation();

  if (this.soundConfig && value != null) {
    this.soundConfig['playDelay'] = value;
  }
};

goog.exportProperty(plugin.im.action.feature.ui.SoundConfigCtrl.prototype,
    'onSoundChange',
    plugin.im.action.feature.ui.SoundConfigCtrl.prototype.onSoundChange);
