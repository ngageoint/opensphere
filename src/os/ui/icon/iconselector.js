goog.provide('os.ui.icon.IconSelectorCtrl');
goog.provide('os.ui.icon.iconSelectorDirective');
goog.require('goog.events.EventTarget');
goog.require('os.ui.Module');
goog.require('os.ui.icon.IconSelectorManager');
goog.require('os.ui.icon.iconPaletteDirective');
goog.require('os.ui.list');


/**
 * Nav bar locations.
 * @type {string}
 */
os.ui.icon.ICON_SELECTORS = 'js-nav-icon__selectors';


/**
 * The iconselector directive
 *
 * @return {angular.Directive}
 */
os.ui.icon.iconSelectorDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'selected': '=',
      'acceptCallback': '=',
      'iconSet': '=',
      'iconSrc': '=?'
    },
    replace: true,
    templateUrl: os.ROOT + 'views/icon/iconselector.html',
    controller: os.ui.icon.IconSelectorCtrl,
    controllerAs: 'selector'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('iconselector', [os.ui.icon.iconSelectorDirective]);



/**
 * Controller function for the iconselector directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.events.EventTarget}
 * @constructor
 * @ngInject
 */
os.ui.icon.IconSelectorCtrl = function($scope, $element) {
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

  this.scope_['tabs'] = os.ui.icon.IconSelectorManager.getInstance().getAll();
  this.scope_['showtabs'] = this.scope_['tabs'].length === 1 ? false : true;
  this.scope_['activeTab'] = this.scope_['tabs'].length > 0 ? this.scope_['tabs'][0]['name'] : '';
  this.scope_['tabMap'] = {};

  for (var i = 0; i < this.scope_['tabs'].length; i++) { // wrap each icon selector in tab structure
    var markup = '<div class="d-flex flex-fill" ng-if="activeTab == \'' +
        this.scope_['tabs'][i]['name'] + '\'">' + this.scope_['tabs'][i]['html'] + '</div>';

    this.scope_['tabMap'][this.scope_['tabs'][i]['name']] = this.scope_['tabs'][i];

    if (!os.ui.list.exists(os.ui.icon.ICON_SELECTORS, markup)) {
      os.ui.list.add(os.ui.icon.ICON_SELECTORS, markup, 201);
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

  this.scope_.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.destroy_.bind(this));
};
goog.inherits(os.ui.icon.IconSelectorCtrl, goog.events.EventTarget);


/**
 * Clean up.
 *
 * @private
 */
os.ui.icon.IconSelectorCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Is valid if the user has picked something
 *
 * @return {boolean}
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.isValid = function() {
  return this.scope_['selected'] && !!this.scope_['selected']['path'];
};


/**
 * Notify parent scope that no icon was selected
 *
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.cancel = function() {
  this.close_();
};


/**
 * Close the window.
 *
 * @private
 */
os.ui.icon.IconSelectorCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};


/**
 * Notify parent scope which icon the user picked
 *
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.okay = function() {
  if (this.scope_['acceptCallback']) {
    this.scope_['acceptCallback'](this.scope_['selected']);
  }
  this.close_();
};


/**
 * Notify parent scope which icon the user picked
 *
 * @param {string} name
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.setTab = function(name) {
  this.scope_['activeTab'] = name;
};


/**
 * Emits signal that certain button is clicked
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.reset = function() {
  this.scope_.$broadcast('iconselector.reseticon');
};


/**
 * Translates from google uri if needed
 *
 * @param {string} path
 * @return {string}
 * @export
 */
os.ui.icon.IconSelectorCtrl.prototype.getPath = function(path) {
  return os.ui.file.kml.GMAPS_SEARCH.test(path) ? os.ui.file.kml.replaceGoogleUri(path) : path;
};
