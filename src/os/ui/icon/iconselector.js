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

  this.scope_['tabs'] = os.ui.icon.IconSelectorManager.getInstance().getAll();
  this.scope_['showtabs'] = this.scope_['tabs'].length === 1 ? false : true;
  this.scope_['activeTab'] = this.scope_['tabs'].length > 0 ? this.scope_['tabs'][0]['name'] : '';

  for (var i = 0; i < this.scope_['tabs'].length; i++) { // wrap each icon selector in tab structure
    os.ui.list.add(os.ui.icon.ICON_SELECTORS, '<div class="properties-tab tab" ng-show="activeTab == \'' +
        this.scope_['tabs'][i]['name'] + '\'">' + this.scope_['tabs'][i]['html'] + '</div>', 201);
  }

  this.scope_.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.destroy_.bind(this));
};
goog.inherits(os.ui.icon.IconSelectorCtrl, goog.events.EventTarget);


/**
 * Clean up.
 * @private
 */
os.ui.icon.IconSelectorCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Is valid if the user has picked something
 * @return {boolean}
 */
os.ui.icon.IconSelectorCtrl.prototype.isValid = function() {
  return this.scope_['selected'] && !!this.scope_['selected']['path'];
};
goog.exportProperty(
    os.ui.icon.IconSelectorCtrl.prototype,
    'isValid',
    os.ui.icon.IconSelectorCtrl.prototype.isValid);


/**
 * Notify parent scope that no icon was selected
 */
os.ui.icon.IconSelectorCtrl.prototype.cancel = function() {
  this.close_();
};
goog.exportProperty(
    os.ui.icon.IconSelectorCtrl.prototype,
    'cancel',
    os.ui.icon.IconSelectorCtrl.prototype.cancel);


/**
 * Close the window.
 * @private
 */
os.ui.icon.IconSelectorCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};


/**
 * Notify parent scope which icon the user picked
 */
os.ui.icon.IconSelectorCtrl.prototype.okay = function() {
  if (this.scope_['acceptCallback']) {
    this.scope_['acceptCallback'](this.scope_['selected']);
  }
  this.close_();
};
goog.exportProperty(
    os.ui.icon.IconSelectorCtrl.prototype,
    'okay',
    os.ui.icon.IconSelectorCtrl.prototype.okay);


/**
 * Notify parent scope which icon the user picked
 * @param {string} name
 */
os.ui.icon.IconSelectorCtrl.prototype.setTab = function(name) {
  this.scope_['activeTab'] = name;
};
goog.exportProperty(
    os.ui.icon.IconSelectorCtrl.prototype,
    'setTab',
    os.ui.icon.IconSelectorCtrl.prototype.setTab);


/**
 * Translates from google uri if needed
 * @param {string} path
 * @return {string}
 */
os.ui.icon.IconSelectorCtrl.prototype.getPath = function(path) {
  return os.ui.file.kml.GMAPS_SEARCH.test(path) ? os.ui.file.kml.replaceGoogleUri(path) : path;
};
goog.exportProperty(
    os.ui.icon.IconSelectorCtrl.prototype,
    'getPath',
    os.ui.icon.IconSelectorCtrl.prototype.getPath);
