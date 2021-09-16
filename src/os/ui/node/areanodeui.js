goog.module('os.ui.node.AreaNodeUI');

const CommandProcessor = goog.require('os.command.CommandProcessor');
const BaseAreaManager = goog.require('os.query.BaseAreaManager');
const Module = goog.require('os.ui.Module');
const AreaRemove = goog.require('os.ui.query.cmd.AreaRemove');
const AbstractNodeUICtrl = goog.require('os.ui.slick.AbstractNodeUICtrl');

const AreaNode = goog.requireType('os.data.AreaNode');


/**
 * The selected/highlighted node UI directive for areas
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
      '<span ng-click="nodeUi.edit()">' +
      '<i class="fa fa-fw c-glyph" ng-class="nodeUi.getTemp() ? \'fa-save\' : \'fa-pencil\'" ' +
          'title="{{nodeUi.getTemp() ? \'Save\' : \'Edit\'}}"></i></span>' +
      '<span ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the area"></i></span>' +
      '</span>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'areanodeui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * @return {boolean} Whether or not the item is temporary
   * @export
   */
  getTemp() {
    var area = /** @type {AreaNode} */ (this.scope['item']).getArea();
    return /** @type {boolean} */ (area.get('temp'));
  }

  /**
   * Removes the area
   *
   * @export
   */
  remove() {
    var area = /** @type {AreaNode} */ (this.scope['item']).getArea();

    if (area) {
      var cmd = new AreaRemove(area);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * Edits the filter
   *
   * @export
   */
  edit() {
    var area = /** @type {AreaNode} */ (this.scope['item']).getArea();

    if (area) {
      BaseAreaManager.save(area);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
