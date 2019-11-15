goog.provide('os.ui.text.transformer.TransformInputController');
goog.provide('os.ui.text.transformers.transformInputDirective');

goog.require('os.ui.Module');
goog.require('os.ui.text.transformer.TextTransformerManager');


/**
 * @return {angular.Directive}
 */
os.ui.text.transformers.transformInputDirective = function() {
  return {
    restrict: 'A',
    scope: {
      'transformTextOptions': '@?'
    },
    controller: os.ui.text.transformer.TransformInputController
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('transformInput', [os.ui.text.transformers.transformInputDirective]);


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.text.transformer.TransformInputController = function($scope, $element, $timeout) {
  /**
   * @type {Array<os.ui.text.transformer.ITextTransformer>}
   * @private
   */
  this.transformers_ = $scope['transformTextOptions'] ?
    os.ui.text.transformer.TextTransformerManager.getInstance().getTextTransformers(
        $scope['transformTextOptions'].split(/\s*,\s*/)) :
    os.ui.text.transformer.TextTransformerManager.getInstance().getTextTransformers();

  const transformers = this.transformers_;
  $element.on('change paste keyup', function() {
    $timeout(() => {
      const val = $(this).val();
      if (typeof val == 'string') {
        let val_ = /** @type {string} */ (val);
        transformers.forEach((transformer) => {
          val_ = transformer.transform(val_);
        });
        if (val_ != val) {
          $(this).val(val_);
        }
      }
    });
  });
};
