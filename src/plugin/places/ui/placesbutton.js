goog.provide('plugin.places.ui.placesButtonDirective');

goog.require('os.ui.window');
goog.require('plugin.places');
goog.require('plugin.places.ui.placesDirective');


/**
 * @type {string}
 * @const
 */
plugin.places.ui.BUTTON_TEMPLATE = '<span class="badge-button">' +
    '<button class="btn btn-default" ng-click="toggleViewer()" title="Toggle the ' + plugin.places.TITLE + ' window" ' +
    'ng-class="{\'active\': isOpen()}">' +
    '<i class="fa fa-fw ' + plugin.places.ICON + '"></i>' +
    '</button></span>';


/**
 * The placesbutton directive
 * @return {angular.Directive}
 */
plugin.places.ui.placesButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: plugin.places.ui.BUTTON_TEMPLATE,
    link: function($scope) {
      $scope['toggleViewer'] = plugin.places.ui.togglePlacesWindow;
      $scope['isOpen'] = os.ui.window.exists.bind(undefined, plugin.places.ID);
    }
  };
};


/**
 * Register placesbutton directive.
 */
os.ui.Module.directive('placesbutton', [plugin.places.ui.placesButtonDirective]);


/**
 * Toggle the places window.
 */
plugin.places.ui.togglePlacesWindow = function() {
  var win = os.ui.window.getById(plugin.places.ID);
  if (win) {
    os.ui.window.close(win);
  } else {
    var windowOptions = {
      'key': plugin.places.ID,
      'label': plugin.places.TITLE,
      'icon': 'fa ' + plugin.places.ICON,
      'x': 'center',
      'y': 'center',
      'width': '325',
      'min-width': '300',
      'max-width': '1200',
      'height': '400',
      'min-height': '250',
      'max-height': '2000',
      'show-close': 'true'
    };
    var template = '<places resize-with="' + os.ui.windowSelector.WINDOW + '"></places>';
    os.ui.window.create(windowOptions, template);
  }
};
