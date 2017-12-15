goog.provide('os.ui.file.dragAndDropIconDirective');


/**
 * The dragAndDropIcon directive
 * @return {angular.Directive}
 */
os.ui.file.dragAndDropIconDirective = function() {
  return {
    restrict: 'E',
    scope: false,
    template: ['<span>',
      '<i class="fa fa-desktop fa-2x color-gray"></i>',
      '<i class="fa fa-share color-dark-gray"',
      'style="position: relative;left: -.50em;bottom: 0.5em;font-size: 1.5em;"></i>',
      '<i class="fa color-gray fa-file" style="position: relative;top: -0.5em;left: -0.5em;font-size: 1.5em;"></i>',
      '</span>']
        .join('')
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('dragAndDropIcon', [os.ui.file.dragAndDropIconDirective]);
