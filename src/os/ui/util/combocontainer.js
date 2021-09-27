goog.declareModuleId('os.ui.util.comboContainerDirective');

import Module from '../module.js';
import {apply} from '../ui.js';

const {getViewportSize} = goog.require('goog.dom');


/**
 * Recognizes "combo-container" class and applies DOM manipulation and styling to make the child "combo-drop"
 * display correctly in all cases (including in scrolling modals).
 *
 * Accepts combo-css attribute, which is a JSON formatted string.
 *  markup: combo-css="{{additionalCss}}"
 *  controller: $scope.additionalCss = '{"width":"708px"}';
 * Also accepts a focus-on attribute. If this is present, the directive will find the child element matching that
 * selector and focus on it when the combo is opened.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'C',
  link: linkFn
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'combo-container';

Module.directive('comboContainer', directive);

/**
 * Link function for combo-container directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {Object} $attrs
 */
const linkFn = function($scope, $element, $attrs) {
  var comboEl = $element.find('.js-combo-drop');
  var updateComboPosition;
  var uniqueId = 'combo-container-' + Date.now();
  $element.attr('data-combo-id', uniqueId);

  /**
   * @param {jQuery.Event=} opt_event
   */
  var hideDropdown = function(opt_event) {
    var comboContainerParent = $(opt_event.target).parents('.combo-container');
    var comboDropParent = $(opt_event.target).parents('.js-combo-drop');

    // this class can be attached to other UIs to indicate that clicking them doesn't close the combo
    // better solution in the long run: get rid of this directive entirely because it's old and bad.
    var noCloseParent = $(opt_event.target).parents('.combo-container-no-close');
    if ((comboContainerParent.length == 0 && comboDropParent.length == 0 && noCloseParent.length == 0) ||
        ($scope['showChoice'] && comboContainerParent.length > 0 &&
        comboContainerParent.attr('data-combo-id') !== uniqueId)) {
      $scope['showChoice'] = false;
      apply($scope);
    }
  };
  $(document).on('mousedown', hideDropdown);

  if (comboEl.length) {
    $('body').append(comboEl);
    $element.find('.combo-box').remove();

    /**
     * Updates the combo position
     */
    updateComboPosition = function() {
      var top = $element.offset().top + $element.height();
      var left = $element.offset().left;
      var width = $element.width();

      var css = {
        'top': top,
        'left': left,
        'position': 'absolute',
        'width': width
      };

      if ($attrs['comboCss']) {
        Object.assign(css, angular.fromJson($attrs['comboCss']));
      }

      if ($attrs['resizable']) {
        var maxWidth = getViewportSize(window).width - $element.offset().left - 50;

        var resizeConfig = {
          'minWidth': width,
          'maxWidth': Math.max(width, maxWidth),
          'minHeight': 400,
          'maxHeight': 600,
          'handles': 'sw, se'
        };
        comboEl.resizable(resizeConfig);
      }

      comboEl.css(css);
      if ($attrs['focusOn']) {
        setTimeout(function() {
          comboEl.find($attrs['focusOn']).focus();
        }, 0);
      }
    };

    $(document).on('scroll', updateComboPosition);
    $scope.$watch('showChoice', function(val) {
      if (val) {
        updateComboPosition();
      }
    });
  }

  $scope.$on('$destroy', function() {
    $(document).off('mousedown', hideDropdown);
    if (updateComboPosition) {
      $(document).off('scroll', updateComboPosition);
    }
    comboEl.remove();
  });
};
