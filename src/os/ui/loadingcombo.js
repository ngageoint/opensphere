goog.provide('os.ui.loadingComboDirective');
goog.require('os.ui.Module');


/**
 * Simple directive for a combo box with a spinner inside.
 * @return {angular.Directive}
 */
os.ui.loadingComboDirective = function() {
  return {
    'restrict': 'E',
    'replace': true,
    'scope': {
      'loading': '='
    },
    'templateUrl': os.ROOT + 'views/loadingcombo.html'
  };
};


/**
 * Register the directive
 */
os.ui.Module.directive('loadingCombo', [os.ui.loadingComboDirective]);
