goog.module('os.ui.file.ui.DefaultFileNodeUI');

const Module = goog.require('os.ui.Module');
const {
  Controller: DescriptorNodeUICtrl,
  directive: descriptorNodeUIDirective
} = goog.require('os.ui.data.DescriptorNodeUI');


/**
 * The selected/highlighted file node UI directive.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var directive = descriptorNodeUIDirective();
  directive.controller = Controller;
  return directive;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'defaultfilenodeui';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted file node UI.
 * @unrestricted
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
   * @inheritDoc
   */
  getRemoveWindowText() {
    return 'Are you sure you want to remove this file from the application? ' +
        '<b>This action cannot be undone</b>, and will clear the application history.';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
