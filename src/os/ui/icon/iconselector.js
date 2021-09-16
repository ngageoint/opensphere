goog.module('os.ui.icon.IconSelectorUI');

const EventTarget = goog.require('goog.events.EventTarget');
const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {GMAPS_SEARCH, replaceGoogleUri} = goog.require('os.ui.file.kml');
const IconSelectorManager = goog.require('os.ui.icon.IconSelectorManager');
const {add, exists} = goog.require('os.ui.list');
const {close} = goog.require('os.ui.window');


/**
 * Nav bar locations.
 * @type {string}
 */
const iconSelectors = 'js-nav-icon__selectors';

/**
 * The iconselector directive
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
  templateUrl: ROOT + 'views/icon/iconselector.html',
  controller: Controller,
  controllerAs: 'selector'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'iconselector';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the iconselector directive
 * @unrestricted
 */
class Controller extends EventTarget {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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
     * @type {boolean}
     */
    this.scope_['showResetButton'] = false;

    this.scope_['tabs'] = IconSelectorManager.getInstance().getAll();
    this.scope_['showtabs'] = this.scope_['tabs'].length === 1 ? false : true;
    this.scope_['activeTab'] = this.scope_['tabs'].length > 0 ? this.scope_['tabs'][0]['name'] : '';
    this.scope_['tabMap'] = {};

    for (var i = 0; i < this.scope_['tabs'].length; i++) { // wrap each icon selector in tab structure
      var markup = '<div class="d-flex flex-fill" ng-if="activeTab == \'' +
          this.scope_['tabs'][i]['name'] + '\'">' + this.scope_['tabs'][i]['html'] + '</div>';

      this.scope_['tabMap'][this.scope_['tabs'][i]['name']] = this.scope_['tabs'][i];

      if (!exists(iconSelectors, markup)) {
        add(iconSelectors, markup, 201);
      }
    }

    this.scope_.$watch('activeTab', function() {
      this['showResetButton'] = false;
    }.bind(this));

    this.scope_.$on('iconselector.showreseticon', function(event) {
      this['showResetButton'] = true;
    }.bind(this));

    this.scope_.$on('iconselector.closewindow', function(event) {
      this.okay();
    }.bind(this));

    this.scope_.$emit(WindowEventType.READY);
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

  /**
   * Is valid if the user has picked something
   *
   * @return {boolean}
   * @export
   */
  isValid() {
    return this.scope_['selected'] && !!this.scope_['selected']['path'];
  }

  /**
   * Notify parent scope that no icon was selected
   *
   * @export
   */
  cancel() {
    this.close_();
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    close(this.element_);
  }

  /**
   * Notify parent scope which icon the user picked
   *
   * @export
   */
  okay() {
    if (this.scope_['acceptCallback']) {
      this.scope_['acceptCallback'](this.scope_['selected']);
    }
    this.close_();
  }

  /**
   * Notify parent scope which icon the user picked
   *
   * @param {string} name
   * @export
   */
  setTab(name) {
    this.scope_['activeTab'] = name;
  }

  /**
   * Emits signal that certain button is clicked
   * @export
   */
  reset() {
    this.scope_.$broadcast('iconselector.reseticon');
  }

  /**
   * Translates from google uri if needed
   *
   * @param {string} path
   * @return {string}
   * @export
   */
  getPath(path) {
    return GMAPS_SEARCH.test(path) ? replaceGoogleUri(path) : path;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
