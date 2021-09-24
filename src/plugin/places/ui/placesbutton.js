goog.module('plugin.places.ui.PlacesButtonUI');

const {Places: PlacesKeys} = goog.require('os.metrics.keys');
const Module = goog.require('os.ui.Module');
const Menu = goog.require('os.ui.menu.Menu');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {createOrEditPlace} = goog.require('plugin.file.kml.ui');
const places = goog.require('plugin.places');
const EventType = goog.require('plugin.places.EventType');
const PlacesManager = goog.require('plugin.places.PlacesManager');
const QuickAddPlacesUI = goog.require('plugin.places.ui.QuickAddPlacesUI');

const {PlacemarkOptions} = goog.requireType('plugin.file.kml.ui');
const {default: KMLNode} = goog.requireType('plugin.file.kml.ui.KMLNode');


/**
 * The places button directive
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'selected': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<div class="btn-group" ng-right-click="ctrl.openMenu()">' +
    '<button class="btn btn-sm btn-success" ng-click="ctrl.addPlace()" title="Add a new place">' +
    '<i class="fa fa-map-marker"></i> Add Place</button>' +
    '<button class="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" ng-click="ctrl.openMenu()">' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'placesbutton';


/**
 * Add the directive to the module
 */
Module.directive('placesbutton', [directive]);


/**
 * Controller function for the places button directive
 * @unrestricted
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this.flag = 'places';
    this.menu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'Create Text Box...',
        eventType: EventType.SAVE_TO_ANNOTATION,
        tooltip: 'Creates a new saved place with a text box at this location',
        icons: ['<i class="fa fa-fw ' + places.Icon.ANNOTATION + '"></i>'],
        handler: this.addPlace.bind(this, true),
        metricKey: PlacesKeys.ADD_ANNOTATION,
        sort: 0
      },
      {
        label: 'Quick Add Places...',
        eventType: EventType.QUICK_ADD_PLACES,
        tooltip: 'Quickly add places to the selected folder',
        icons: ['<i class="fa fa-fw ' + places.Icon.QUICK_ADD + '"></i>'],
        handler: this.quickAddPlaces.bind(this),
        metricKey: PlacesKeys.QUICK_ADD_PLACES,
        sort: 10
      }]
    }));
  }

  /**
   * Create a new place and add it.
   *
   * @param {boolean=} opt_annotation Whether the place is an annotation.
   * @export
   */
  addPlace(opt_annotation) {
    var parent = this.getParent();
    if (parent) {
      createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
        'annotation': opt_annotation,
        'parent': parent
      }));
    }
  }

  /**
   * Launch the quick add places dialog.
   */
  quickAddPlaces() {
    QuickAddPlacesUI.launch(this.getParent(true));
  }

  /**
   * Gets the appropriate parent node for the selected node(s);
   *
   * @param {boolean=} opt_excludeRoot Optional parameter to not return the root node when there's no selection.
   * @return {KMLNode} The parent node.
   */
  getParent(opt_excludeRoot) {
    var selected = this.scope['selected'];
    var root = opt_excludeRoot ? null : PlacesManager.getInstance().getPlacesRoot();
    var parent = selected && selected.length == 1 ? selected[0] : root;
    while (parent && !parent.isFolder()) {
      parent = parent.getParent();
    }

    return parent;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
