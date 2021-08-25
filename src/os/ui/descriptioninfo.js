goog.module('os.ui.DescriptionInfoUI');
goog.module.declareLegacyNamespace();

const {buildString, isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const {sanitize} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const osWindow = goog.require('os.ui.window');


/**
 * The descriptioninfo directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'description': '='
  },
  templateUrl: ROOT + 'views/descriptioninfo.html',
  controller: Controller,
  controllerAs: 'info'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'descriptioninfo';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the descriptioninfo directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    var sanitized = sanitize(this.scope_.description || '');
    if (!isEmptyOrWhitespace(makeSafe(sanitized))) {
      // force anchor tags to launch a new tab
      sanitized = sanitized.replace(/<a /g, '<a target="_blank" ');

      var iframe = this.element_.find('iframe')[0];
      if (iframe) {
        var frameDoc = iframe.contentWindow.document;
        frameDoc.open();
        frameDoc.write(sanitized);
        frameDoc.close();
      }
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.element_ = null;
  }
}


/**
 * Launches a feature info window for the provided feature.
 *
 * @param {!string} id The id to use for the window.
 * @param {!string} description The description string to display.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
const launchDescriptionInfo = function(id, description, opt_titleDetail) {
  var winLabel = 'Description';

  if (opt_titleDetail) {
    winLabel += ' for ' + opt_titleDetail;
  }

  var windowId = buildString('descriptionInfo', id);

  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    // create a new window
    var scopeOptions = {
      'description': description
    };

    // allowing this to be resizeable causes the mousewheel to not work on the external view
    var windowOptions = {
      'id': windowId,
      'label': winLabel,
      'icon': 'fa fa-newspaper-o',
      'x': 'center',
      'y': 'center',
      'width': '800',
      'min-width': '800',
      'max-width': '800',
      'height': '600',
      'min-height': '600',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = '<descriptioninfo description="description"></descriptioninfo>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
goog.exportSymbol('os.ui.launchDescriptionInfo', launchDescriptionInfo);

exports = {
  Controller,
  directive,
  directiveTag,
  launchDescriptionInfo
};
