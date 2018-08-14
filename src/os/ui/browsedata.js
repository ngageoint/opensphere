goog.provide('os.ui.BrowseDataCtrl');
goog.provide('os.ui.browseDataDirective');

goog.require('goog.events.EventType');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.DescriptorEventType');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.search.FacetedSearchCtrl');
goog.require('os.ui.window');


/**
 * The Browse Data window directive
 * @return {angular.Directive}
 */
os.ui.browseDataDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/browsedata.html',
    controller: os.ui.BrowseDataCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('browsedata', [os.ui.browseDataDirective]);



/**
 * Controller for Browse Data window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.search.FacetedSearchCtrl}
 * @constructor
 * @ngInject
 */
os.ui.BrowseDataCtrl = function($scope, $element) {
  os.ui.BrowseDataCtrl.base(this, 'constructor', $scope, $element);

  var dm = os.dataManager;
  dm.listen(os.data.DescriptorEventType.ADD_DESCRIPTOR, this.update, false, this);
  dm.listen(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, this.update, false, this);
  dm.listen(os.data.DataProviderEventType.LOADED, this.update, false, this);

  // If you are enabling the area facet, turn this back on
  // var am = os.query.AreaManager.getInstance();
  // am.listen(goog.events.EventType.PROPERTYCHANGE, this.update, false, this);

  os.settings.listen(os.user.settings.FavoriteManager.KEY, this.update, false, this);
};
goog.inherits(os.ui.BrowseDataCtrl, os.ui.search.FacetedSearchCtrl);


/**
 * @inheritDoc
 */
os.ui.BrowseDataCtrl.prototype.destroy = function() {
  os.ui.BrowseDataCtrl.base(this, 'destroy');
  var dm = os.dataManager;
  dm.unlisten(os.data.DescriptorEventType.ADD_DESCRIPTOR, this.update, false, this);
  dm.unlisten(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, this.update, false, this);
  dm.unlisten(os.data.DataProviderEventType.LOADED, this.update, false, this);

  // If you are enabling the area facet, turn this back on
  // var am = os.query.AreaManager.getInstance();
  // am.unlisten(goog.events.EventType.PROPERTYCHANGE, this.update, false, this);

  os.settings.unlisten(os.user.settings.FavoriteManager.KEY, this.update, false, this);
};


/**
 * Launches the window
 * @param {os.search.AppliedFacets} facets
 */
os.ui.BrowseDataCtrl.launch = function(facets) {
  var label = 'Browse Data';
  var openWindows = angular.element('div[label="' + label + '"].window');

  if (!openWindows.length) {
    var windowOptions = {
      'label': label,
      'key': 'browse',
      'icon': 'fa ',
      'x': 'center',
      'y': 'center',
      'width': 800,
      'height': 600,
      'show-close': true,
      'no-scroll': true,
      'min-width': 300,
      'max-width': 1000,
      'min-height': 200,
      'max-height': 1000
    };

    var scope = {
      'facets': facets
    };

    var template = '<browsedata></browsedata>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    os.ui.window.bringToFront('browse');
  }
};


/**
 * Closes the window
 */
os.ui.BrowseDataCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.BrowseDataCtrl.prototype, 'close', os.ui.BrowseDataCtrl.prototype.close);


/**
 * Loads a file/URL
 */
os.ui.BrowseDataCtrl.prototype.launchFileImport = function() {
  os.dispatcher.dispatchEvent(os.ui.im.ImportEventType.FILE);
};
goog.exportProperty(os.ui.BrowseDataCtrl.prototype, 'launchFileImport',
    os.ui.BrowseDataCtrl.prototype.launchFileImport);


