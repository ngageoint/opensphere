goog.declareModuleId('os.ui.slick.SlickHeaderButtonUI');

import Module from '../module.js';
import {Controller as SlickGridCtrl, directive as slickGridDirective} from './slickgrid.js';


/**
 * The slickheaderbutton directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = slickGridDirective();
  dir['scope']['onCommand'] = '=?';
  dir['controller'] = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'slickheaderbutton';

/**
 * Add the directive
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller class for SlickGrid with header buttons
 * @unrestricted
 */
export class Controller extends SlickGridCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super($scope, $element, $compile);

    var headerButtonsPlugin = new Slick.Plugins.HeaderButtons();

    headerButtonsPlugin.onCommand.subscribe(function(e, args) {
      var button = args['button'];
      var command = args['command'];
      var idx = this.grid.getColumnIndex(args['column']['id']);
      var column = this.scope['columns'][idx];

      this.scope['onCommand'](column, button, command, this.scope['columns']);
    }.bind(this));

    this.grid.registerPlugin(headerButtonsPlugin);
  }
}
