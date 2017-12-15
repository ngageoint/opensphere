goog.provide('os.ui.croppie.CroppieCtrl');
goog.provide('os.ui.croppie.croppieDirective');
goog.require('os.capture');
goog.require('os.file.File');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * The profileEditAvatar directive
 * @return {angular.Directive}
 */
os.ui.croppie.croppieDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'url': '=',
      'height': '=',
      'width': '=',
      'type': '=?'
    },
    templateUrl: os.ROOT + 'views/croppie/croppie.html',
    controller: os.ui.croppie.CroppieCtrl,
    controllerAs: 'croppieCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('croppie', [os.ui.croppie.croppieDirective]);



/**
 * Controller function for the profileEditAvatar directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.croppie.CroppieCtrl = function($scope, $element) {
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

  /**
   * The shape of the image (square or circle)
   */
  this.scope_['type'] = this.scope_['type'] || 'square';

  /**
   * The croppie object
   * @type {Croppie}
   * @private
   */
  this.croppie_ = new Croppie(this.element_.find('#croppie')[0], {
    'url': this.scope_['url'],
    'viewport': {'width': this.scope_['width'], 'height': this.scope_['width'], 'type': this.scope_['type']},
    'boundary': {'width': 256, 'height': 256}
  });

  this.scope_.$emit('window.ready');
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.croppie.CroppieCtrl.prototype.destroy_ = function() {
  if (this.croppie_) {
    this.croppie_.destroy();
  }
  this.croppie_ = null;
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Save
 */
os.ui.croppie.CroppieCtrl.prototype.save = function() {
  var options = {
    'type': 'blob',
    'format': 'png',
    'quality': 1,
    'size': 'viewport',
    'circle': this.scope_['type'] == 'circle'
  };
  this.croppie_.result(options).then(goog.bind(function(blob) {
    var file = new os.file.File();
    file.setFileName('avatar.png');
    file.setContent(blob);
    file.setContentType('image/png');
    this.scope_.$emit('croppie.cropped', file);
    this.cancel();
  }, this));
};
goog.exportProperty(
    os.ui.croppie.CroppieCtrl.prototype,
    'save',
    os.ui.croppie.CroppieCtrl.prototype.save);


/**
 * Cancel
 */
os.ui.croppie.CroppieCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.croppie.CroppieCtrl.prototype,
    'cancel',
    os.ui.croppie.CroppieCtrl.prototype.cancel);
