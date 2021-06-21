goog.module('plugin.xyz.XYZDescriptorNodeUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const DescriptorNodeUICtrl = goog.require('os.ui.data.DescriptorNodeUICtrl');
const uiWindow = goog.require('os.ui.window');


/**
 * Generic node UI for XYZ descriptors.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'AE',
    replace: true,
    template:
    '<div>' +
      '<span ng-if="nodeUi.show()" class="flex-shrink-0" ng-click="nodeUi.edit()">' +
        '<i class="fa fa-pencil-alt fa-fw c-glyph" title="Edit this layer"></i>' +
      '</span>' +
      '<span ng-if="nodeUi.show()" class="flex-shrink-0" ng-click="nodeUi.tryRemove()">' +
        '<i class="fa fa-trash-o fa-fw c-glyph" title="Remove this layer from the application"></i>' +
      '</span>' +
    '</div>',
    controller: Controller,
    controllerAs: 'nodeUi'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'xyzdescriptornodeui';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for descriptor node UI.
 *
 */
class Controller extends DescriptorNodeUICtrl {
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
   * Open a window to edit the descriptor.
   * @export
   */
  edit() {
    const editUi = '<xyzprovider></xyzprovider>';
    const descriptor = this.getDescriptor();

    var config = descriptor.getBaseConfig();
    config['label'] = config['title'] = descriptor.getTitle();
    config['url'] = config['urls'][0];

    var scopeOptions = {
      'config': config
    };

    var windowOptions = {
      'label': 'Edit ' + config.title,
      'icon': 'fa fa-database',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '350',
      'max-width': '600',
      'height': 'auto',
      'min-height': '250',
      'max-height': '500',
      'modal': 'true',
      'show-close': 'true'
    };
    uiWindow.create(windowOptions, editUi, undefined, undefined, undefined, scopeOptions);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
