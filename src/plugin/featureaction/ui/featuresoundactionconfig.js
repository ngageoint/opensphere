goog.provide('plugin.im.action.feature.ui.SoundConfigCtrl');
goog.provide('plugin.im.action.feature.ui.soundConfigDirective');
goog.require('os.audio.AudioManager');
goog.require('os.object');
goog.require('os.ui.Module');
goog.require('os.ui.icon.IconPickerEventType');
goog.require('os.ui.im.action.EventType');
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
    template: '<div><select ' +
    'ng-model="sound" ' +
    'ng-change="ctrl.onSoundChange()"' +
    'style="width:100%" ' +
    'ng-options="val for val in sounds">' +
    '</select></div>',
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
  $scope['sounds'] = os.audio.AudioManager.getInstance().getSounds();

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
 * Play selected sound on change
 */
plugin.im.action.feature.ui.SoundConfigCtrl.prototype.onSoundChange = function() {
  var snd = this.scope['sound'];
  os.audio.AudioManager.getInstance().play(snd);
  this.soundConfig['sound'] = this.scope['sound'];
};

goog.exportProperty(plugin.im.action.feature.ui.SoundConfigCtrl.prototype,
    'onSoundChange',
    plugin.im.action.feature.ui.SoundConfigCtrl.prototype.onSoundChange);



