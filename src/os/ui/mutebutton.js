goog.provide('os.ui.MuteButtonCtrl');
goog.provide('os.ui.muteButtonDirective');

goog.require('os.audio.AudioManager');
goog.require('os.ui.Module');


/**
 * The mute button directive
 * @return {angular.Directive} The mute button directive
 */
os.ui.muteButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.MuteButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()"' +
      ' title="{{mute ? \'Unmute\': \'Mute\'}}">' +
      '<i class="fa {{mute ? \'fa-volume-off\' : \'fa-volume-up\'}}"></i>' +
      '</button>'
  };
};


// add the directive to the module
os.ui.Module.directive('muteButton', [os.ui.muteButtonDirective]);



/**
 * The mute button controller
 * @param {!angular.Scope} $scope The scope
 * @constructor
 * @ngInject
 */
os.ui.MuteButtonCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
  this.scope['mute'] = os.audio.AudioManager.getInstance().getMute();
};


/**
 * Toggles mute
 */
os.ui.MuteButtonCtrl.prototype.toggle = function() {
  var am = os.audio.AudioManager.getInstance();
  am.setMute(!am.getMute());
  this.scope['mute'] = am.getMute();
};
goog.exportProperty(os.ui.MuteButtonCtrl.prototype, 'toggle', os.ui.MuteButtonCtrl.prototype.toggle);


