goog.module('os.ui.file.dragAndDropIconDirective');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');

/**
 * The dragAndDropIcon directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: false,
  replace: true,
  template: ['<span class="flex-shrink-0">',
    '<i class="fa fa-desktop fa-2x text-body"></i>',
    '<i class="fa fa-share text-muted c-drag-and-drop-icon__share"></i>',
    '<i class="fa fa-file text-body c-drag-and-drop-icon__file"></i>',
    '</span>']
      .join('')
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'drag-and-drop-icon';

/**
 * Add the directive to the module.
 */
Module.directive('dragAndDropIcon', [directive]);

exports = {
  directive,
  directiveTag
};
