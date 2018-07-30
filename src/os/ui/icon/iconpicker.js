goog.provide('os.ui.icon.IconPickerCtrl');
goog.provide('os.ui.icon.IconPickerEventType');
goog.provide('os.ui.icon.iconPickerDirective');

goog.require('os.ui.Module');
goog.require('os.ui.icon.iconSelectorDirective');



/**
 * Icon picker event types.
 * @enum {string}
 */
os.ui.icon.IconPickerEventType = {
  CHANGE: 'icon:change'
};


/**
 * A icon picker directive
 * @return {angular.Directive}
 */
os.ui.icon.iconPickerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'disabled': '=',
      'ngModel': '=',
      'iconSet': '=',
      'iconSrc': '=?'
    },
    templateUrl: os.ROOT + 'views/icon/iconpicker.html',
    controller: os.ui.icon.IconPickerCtrl,
    controllerAs: 'iconPicker'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('iconpicker', [os.ui.icon.iconPickerDirective]);



/**
 * Controller for the icon picker directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.icon.IconPickerCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {string}
   */
  this['disabled'] = this.scope['disabled'] || !this.scope['iconSet'];
};


/**
 * Handles icon pick events.
 * @param {osx.icon.Icon} icon The new icon
 * @private
 */
os.ui.icon.IconPickerCtrl.prototype.onSelection_ = function(icon) {
  if (this.scope) {
    this.scope['ngModel'] = icon;
    this.scope.$emit(os.ui.icon.IconPickerEventType.CHANGE, icon);
  }
};


/**
 * Toggle the icon picker on/off.
 */
os.ui.icon.IconPickerCtrl.prototype.show = function() {
  var ui = '<iconselector class="d-flex flex-fill" accept-callback="acceptCallback" selected="icon"' +
      'icon-set="iconSet" icon-src="iconSrc"> </iconselector>';
  var scopeOptions = {
    'acceptCallback': this.onSelection_.bind(this),
    'icon': os.object.unsafeClone(this.scope['ngModel']),
    'iconSet': this.scope['iconSet'],
    'iconSrc': this.scope['iconSrc']
  };
  os.ui.icon.IconPickerCtrl.launch(ui, scopeOptions);
};


/**
 * Translates from google uri if needed
 * @param {string} path
 * @return {string}
 */
os.ui.icon.IconPickerCtrl.prototype.getPath = function(path) {
  return os.ui.file.kml.GMAPS_SEARCH.test(path) ? os.ui.file.kml.replaceGoogleUri(path) : path;
};
goog.exportProperty(
    os.ui.icon.IconPickerCtrl.prototype,
    'getPath',
    os.ui.icon.IconPickerCtrl.prototype.getPath);


/**
 * Starts the dedupe process for the provided source
 * @param {string} template
 * @param {Object} scopeOptions
 */
os.ui.icon.IconPickerCtrl.launch = function(template, scopeOptions) {
  var windowId = 'iconselector';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': 'Choose an Icon',
      'icon': 'fa fa-flag',
      'x': 'center',
      'y': 'center',
      'width': '600',
      'min-width': '400',
      'max-width': '1200',
      'height': '600',
      'min-height': '400',
      'max-height': '1200',
      'show-close': 'true',
      'modal': 'true'
    };

    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
