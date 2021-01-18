goog.module('os.ui.DockedWindowUI');
goog.module.declareLegacyNamespace();

const OsModule = goog.require('os.ui.Module');
const {
  Controller: SavedWindowCtrl,
  directive: savedWindowDirective} = goog.require('os.ui.SavedWindowUI');
const {ROOT} = goog.require('os');
const windowSelector = goog.require('os.ui.windowSelector');

const DOCKED_WINDOW_ATTR = 'dock';
const DOCKED_WINDOW_BOTTOM_SELECTOR = '#js-dock-bottom__container';
const DOCKED_WINDOW_BOTTOM_MICRO_SELECTOR = '#js-dock-bottom-micro__container';

/**
 * Controller for the docked window directive.
 *   Not everything is perfect in the proof of concept. Suggested areas of development if
 *   this gets reused in the future:
 *    - Rewrite os.ui.window utility functions to work in an object-oriented way
 *    - Update positioning (see constructor)
 *    - Handle these actions in this controller:
 *        pop-out (i.e. convert to normal Window) and
 *        pop-in (i.e. convert window to docked window)
 *        pop-in micro (i.e. convert window to a docked window in the bottom nav bar)
 *    - Animate grow/shrink
 *
 * @unrestricted
 */
class Controller extends SavedWindowCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    // TODO in the future, override positioning in an object-oriented way instead
    $element.css('top', '0');
    $element.css('left', '0');
    $element.css('width', 'auto');
  }

  /**
   * @inheritDoc
   */
  onHeaderBtnClick(event, headerBtnCfg) {
    var winEl = $(event.target).parents(windowSelector.DOCKED);
    headerBtnCfg.onClick(winEl);
  }
}

/**
 * This is the exact same as the saved window control except that it docks to bottom (TODO left, right, top)
 *
 * @example
 * <pre>
 * <docked-window dock="bottom" show-close="true">
 *  ...
 * </docked-window>
 * </pre>
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = savedWindowDirective();
  dir.scope['dock'] = '@';
  dir.templateUrl = ROOT + 'views/window/dockedwindow.html';
  dir.controller = Controller;

  return dir;
};


/**
 * Add the directive to the os module
 */
OsModule.directive('dockedWindow', [directive]);

exports = {
  Controller,
  directive,
  DOCKED_WINDOW_ATTR,
  DOCKED_WINDOW_BOTTOM_SELECTOR,
  DOCKED_WINDOW_BOTTOM_MICRO_SELECTOR
};
