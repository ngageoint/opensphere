goog.provide('os.ui.buffer.BufferDialogCtrl');
goog.provide('os.ui.buffer.bufferDialogDirective');
goog.require('ol.Feature');
goog.require('ol.proj.EPSG3857');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.buffer.bufferFormDirective');


/**
 * The bufferdialog directive
 * @return {angular.Directive}
 */
os.ui.buffer.bufferDialogDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/buffer/bufferdialog.html',
    controller: os.ui.buffer.BufferDialogCtrl,
    controllerAs: 'buffer'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('bufferdialog', [os.ui.buffer.bufferDialogDirective]);



/**
 * Controller function for the bufferdialog directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.buffer.BufferDialogCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {os.buffer.BufferConfig}
   * @protected
   */
  this.config = $scope['config'] = os.buffer.getBaseConfig();

  /**
   * Warning message to display in the UI.
   * @type {string}
   */
  this['warningMessage'] = '';

  if ($scope['features'] && $scope['features'].length > 0) {
    // features were provided so hide the source picker
    this.config['features'] = $scope['features'];
    this['showSourcePicker'] = false;

    // if the features have a source and it's the same for all features, set the source so columns will be displayed
    var source = os.feature.getSource(this.config['features'][0]);
    if (source) {
      for (var i = 0; i < this.config['features'].length; i++) {
        if (os.feature.getSource(this.config['features'][0]) != source) {
          source = null;
          break;
        }
      }

      $scope['sources'] = source ? [source] : undefined;
    }
  } else {
    // features weren't provided, allow the user to choose from loaded sources
    this['showSourcePicker'] = true;
  }

  // title override was provided
  if ($scope['title']) {
    this.config['title'] = $scope['title'];
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Clean up.
 * @private
 */
os.ui.buffer.BufferDialogCtrl.prototype.destroy_ = function() {
  this.element_ = null;
};


/**
 * Close the window.
 * @export
 */
os.ui.buffer.BufferDialogCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element_);
};


/**
 * Create buffer regions and close the window.
 * @export
 */
os.ui.buffer.BufferDialogCtrl.prototype.confirm = function() {
  os.buffer.createFromConfig(this.config);
  this.cancel();
};


/**
 * Get the status text to display at the bottom of the dialog.
 * @return {string}
 * @export
 */
os.ui.buffer.BufferDialogCtrl.prototype.getStatus = function() {
  if (!this['showSourcePicker']) {
    return '';
  }

  if (!this.isDataReady()) {
    return 'No features chosen.';
  }

  var count = this.config['features'].length;
  return count + ' feature' + (count > 1 ? 's' : '') + ' chosen.';
};


/**
 * If the status display is valid.
 * @return {string}
 * @export
 */
os.ui.buffer.BufferDialogCtrl.prototype.isDataReady = function() {
  return !this['showSourcePicker'] || (this.config && this.config['features'] && this.config['features'].length > 0);
};
