goog.module('os.ui.icon.IconPaletteUI');

const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The iconpalette directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: {
    'selected': '=',
    'acceptCallback': '=',
    'iconSet': '=',
    'iconSrc': '=?'
  },
  replace: true,
  templateUrl: ROOT + 'views/icon/iconpalette.html',
  controller: Controller,
  controllerAs: 'palette'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'iconpalette';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the iconpalette directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
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
            this.pick(ics[i]['path'], ics[i]['title'], ics[i]['options']);
            break;
          }
        }
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
  }

  /**
   * Get the icon src to use in the Image element.
   *
   * @param {string} src The icon src.
   * @return {string} The adjusted icon source.
   * @export
   */
  getIconSrc(src) {
    return this.scope_ && this.scope_['iconSrc'] ? this.scope_['iconSrc'](src) : src;
  }

  /**
   * Notify parent scope that a icon was chosen.
   *
   * @param {string} iconPath The selected iconPath
   * @param {string} iconTitle The selected iconTitle
   * @param {Object|undefined} options The selected options
   * @export
   */
  pick(iconPath, iconTitle, options) {
    this.scope_['selected']['path'] = iconPath;
    this.scope_['selected']['title'] = iconTitle;
    this.scope_['selected']['options'] = options;
    apply(this.scope_);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
