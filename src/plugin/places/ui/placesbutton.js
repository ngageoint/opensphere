goog.provide('plugin.places.ui.PlacesButtonCtrl');
goog.provide('plugin.places.ui.placesButtonDirective');

goog.require('os.ui.Module');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('plugin.file.kml.ui');
goog.require('plugin.places.menu');
goog.require('plugin.places.ui.QuickAddPlacesCtrl');


/**
 * The places button directive
 * @return {angular.Directive}
 */
plugin.places.ui.placesButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'selected': '='
    },
    controller: plugin.places.ui.PlacesButtonCtrl,
    controllerAs: 'ctrl',
    template: '<div class="btn-group" ng-right-click="ctrl.openMenu()">' +
      '<button class="btn btn-sm btn-success" ng-click="ctrl.addPlace()" title="Add a new place">' +
      '<i class="fa fa-placemark"></i> Add Place</button>' +
      '<button class="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" ng-click="ctrl.openMenu()">' +
      '</button>'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('placesbutton', [plugin.places.ui.placesButtonDirective]);


/**
 * Controller function for the places button directive
 * @param {!angular.Scope} $scope The scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
plugin.places.ui.PlacesButtonCtrl = function($scope, $element) {
  plugin.places.ui.PlacesButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'places';
  this.menu = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Create Text Box...',
      eventType: plugin.places.menu.EventType.SAVE_TO_ANNOTATION,
      tooltip: 'Creates a new saved place with a text box at this location',
      icons: ['<i class="fa fa-fw ' + plugin.places.Icon.ANNOTATION + '"></i>'],
      handler: this.addPlace.bind(this, true),
      metricKey: os.metrics.Places.ADD_ANNOTATION,
      sort: 0
    },
    {
      label: 'Quick Add Places...',
      eventType: plugin.places.menu.EventType.QUICK_ADD_PLACES,
      tooltip: 'Quickly add places to the selected folder',
      icons: ['<i class="fa fa-fw ' + plugin.places.Icon.QUICK_ADD + '"></i>'],
      handler: this.quickAddPlaces.bind(this),
      metricKey: os.metrics.Places.QUICK_ADD_PLACES,
      sort: 10
    }]
  }));
};
goog.inherits(plugin.places.ui.PlacesButtonCtrl, os.ui.menu.MenuButtonCtrl);


/**
 * Create a new place and add it.
 *
 * @param {boolean=} opt_annotation Whether the place is an annotation.
 * @export
 */
plugin.places.ui.PlacesButtonCtrl.prototype.addPlace = function(opt_annotation) {
  var parent = this.getParent();
  if (parent) {
    plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
      'annotation': opt_annotation,
      'parent': parent
    }));
  }
};


/**
 * Launch the quick add places dialog.
 */
plugin.places.ui.PlacesButtonCtrl.prototype.quickAddPlaces = function() {
  plugin.places.ui.QuickAddPlacesCtrl.launch(this.getParent(true));
};


/**
 * Gets the appropriate parent node for the selected node(s);
 *
 * @param {boolean=} opt_excludeRoot Optional parameter to not return the root node when there's no selection.
 * @return {plugin.file.kml.ui.KMLNode} The parent node.
 */
plugin.places.ui.PlacesButtonCtrl.prototype.getParent = function(opt_excludeRoot) {
  var selected = this.scope['selected'];
  var root = opt_excludeRoot ? null : plugin.places.PlacesManager.getInstance().getPlacesRoot();
  var parent = selected && selected.length == 1 ? selected[0] : root;
  while (parent && !parent.isFolder()) {
    parent = parent.getParent();
  }

  return parent;
};
