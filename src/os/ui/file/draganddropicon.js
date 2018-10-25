goog.provide('os.ui.file.dragAndDropIconDirective');


/**
 * The dragAndDropIcon directive
 * @return {angular.Directive}
 */
os.ui.file.dragAndDropIconDirective = function() {
  return {
    restrict: 'E',
    scope: false,
    replace: true,
    template: ['<span>',
      '<i class="fa fa-desktop fa-2x"></i>',
      '<i class="fa fa-share text-muted c-drag-and-drop-icon__share"></i>',
      '<i class="fa fa-file c-drag-and-drop-icon__file"></i>',
      '</span>']
        .join('')
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('dragAndDropIcon', [os.ui.file.dragAndDropIconDirective]);
