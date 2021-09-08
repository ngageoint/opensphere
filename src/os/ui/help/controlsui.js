goog.module('os.ui.help.ControlsUI');

goog.require('os.ui.help.ControlBlockUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const Controls = goog.require('os.ui.help.Controls');
const {bringToFront, create, exists} = goog.require('os.ui.window');


/**
 * A directive to display the help menu
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/help/controls.html',
  controller: Controller,
  controllerAs: 'controlsHelp'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'controlshelp';

/**
 * Register the directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Display the controls for this application
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    var controls = Controls.getInstance().getControls();
    controls.sort(function(a, b) {
      return a['order'] > b['order'] ? 1 : a['order'] < b['order'] ? -1 : 0;
    });

    var splitIndex = (controls.length / 2) + 1;

    /**
     * List of controls
     * @type {Object}
     */
    this['controls'] = {
      'left': controls.slice(0, splitIndex),
      'right': controls.slice(splitIndex, controls.length)
    };
  }
}

/**
 * Launch the controls window
 */
const launchControlsHelp = () => {
  var id = 'controlsHelp';
  if (exists(id)) {
    bringToFront(id);
  } else {
    create({
      'id': id,
      'x': 'center',
      'y': 'center',
      'label': 'Controls',
      'show-close': true,
      'min-width': 850,
      'min-height': 750,
      'max-width': 900,
      'max-height': 800,
      'modal': false,
      'width': 850,
      'height': 750,
      'icon': 'fa fa-keyboard-o'
    }, 'controlshelp');
  }
};

exports = {
  Controller,
  directive,
  directiveTag,
  launchControlsHelp
};
