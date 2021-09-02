goog.module('os.ui.MuteButtonUI');
goog.module.declareLegacyNamespace();

const AudioManager = goog.require('os.audio.AudioManager');
const Module = goog.require('os.ui.Module');


/**
 * The mute button directive
 *
 * @return {angular.Directive} The mute button directive
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()"' +
    ' title="{{mute ? \'Turn sound on\': \'Turn sound off\'}}">' +
    '<i class="fa fa-fw {{mute ? \'fa-volume-off\' : \'fa-volume-up\'}}"></i> ' +
    '<span ng-class="{\'d-none\': puny}">{{mute ? \'Unmute\': \'Mute\'}}</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'mute-button';

// add the directive to the module
Module.directive('muteButton', [directive]);

/**
 * The mute button controller
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
    this.scope['mute'] = AudioManager.getInstance().getMute();
  }

  /**
   * Toggles mute
   *
   * @export
   */
  toggle() {
    var am = AudioManager.getInstance();
    am.setMute(!am.getMute());
    this.scope['mute'] = am.getMute();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
