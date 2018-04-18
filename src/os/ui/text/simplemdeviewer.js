goog.provide('os.ui.text.SimpleMDEViewer');
goog.provide('os.ui.text.SimpleMDEViewerCtrl');
goog.provide('os.ui.text.simpleMDEViewerDirective');
goog.require('os.ui.Module');
goog.require('os.ui.text.simpleMDEDirective');


/**
 * The count by directive
 * @return {angular.Directive}
 */
os.ui.text.simpleMDEViewerDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'text': '='
    },
    template: '<div class="window-content-wrapper limitsimpleMDE-preview__medium simplemdeviewer">' +
        '<div class="window-content no-footer"><simplemde text="text"></simplemde></div></div>',
    controller: os.ui.text.SimpleMDEViewerCtrl
  };
};


/**
 * Add the directive to the tools module
 */
os.ui.Module.directive('simplemdeviewer', [os.ui.text.simpleMDEViewerDirective]);



/**
 * Controller class for the source switcher
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.text.SimpleMDEViewerCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  $scope['text'] = $scope['text'] || '';
  $scope.$on('$destroy', this.onDestroy_.bind(this));
  $timeout(goog.bind(function() {
    this.scope_.$emit(os.ui.WindowEventType.READY);
  }, this), 250);
};


/**
 * Cleanup
 * @private
*/
os.ui.text.SimpleMDEViewerCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
};


/**
 * Open the report viewer with a simpleMDE
 * @param {string} text
 * @param {string} title
 */
os.ui.text.SimpleMDEViewer.launchViewer = function(text, title) {
  var winOptions = {
    'id': 'simplemdeviewer',
    'label': title + ' Viewer',
    'icon': 'fa fa-file-text-o',
    'x': 'center',
    'y': 'center',
    'width': '750',
    'min-width': '750',
    'max-width': '1000',
    'height': 'auto',
    'min-height': '250',
    'max-height': '1200',
    'show-close': 'true',
    'modal': 'true'
  };

  os.ui.window.create(winOptions, '<simplemdeviewer class="limitsimpleMDE" text="text"></simplemdeviewer>',
      undefined, undefined, undefined, {
        'text': text
      }
  );
};
