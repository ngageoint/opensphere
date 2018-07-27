goog.provide('os.ui.icon.IconPaletteCtrl');
goog.provide('os.ui.icon.iconPaletteDirective');

goog.require('os.ui.Module');



/**
 * The iconpalette directive
 * @return {angular.Directive}
 */
os.ui.icon.iconPaletteDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'selected': '=',
      'acceptCallback': '=',
      'iconSet': '=',
      'iconSrc': '=?'
    },
    templateUrl: os.ROOT + 'views/icon/iconpalette.html',
    controller: os.ui.icon.IconPaletteCtrl,
    controllerAs: 'palette'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('iconpalette', [os.ui.icon.iconPaletteDirective]);


/**
 * Base Angular event types for the icon palette.
 * @type {Object}
 */
os.ui.icon.IconPaletteEventType = {
  SELECTED: 'palette.selected'
};



/**
 * Controller function for the iconpalette directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.icon.IconPaletteCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var ics = this.scope_['iconSet'] ? this.scope_['iconSet'] : [];
  if (this.scope_['selected'] && ics) { // if a default icon is provided, pre-select it
    var con = /** @type {osx.icon.Icon} */ (this.scope_['selected']);
    if (con && con['path']) {
      for (var i = 0; i < ics.length; i++) {
        if (ics[i]['path'] == con['path']) {
          this.pick(ics[i]['path']);
          break;
        }
      }
    }
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.icon.IconPaletteCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Get the icon src to use in the Image element.
 * @param {string} src The icon src.
 * @return {string} The adjusted icon source.
 */
os.ui.icon.IconPaletteCtrl.prototype.getIconSrc = function(src) {
  return this.scope_ && this.scope_['iconSrc'] ? this.scope_['iconSrc'](src) : src;
};
goog.exportProperty(
    os.ui.icon.IconPaletteCtrl.prototype,
    'getIconSrc',
    os.ui.icon.IconPaletteCtrl.prototype.getIconSrc);


/**
 * Notify parent scope that a icon was chosen.
 * @param {string} iconPath The selected iconPath
 */
os.ui.icon.IconPaletteCtrl.prototype.pick = function(iconPath) {
  this.scope_['selected']['path'] = iconPath;
  os.ui.apply(this.scope);
};
goog.exportProperty(
    os.ui.icon.IconPaletteCtrl.prototype,
    'pick',
    os.ui.icon.IconPaletteCtrl.prototype.pick);
