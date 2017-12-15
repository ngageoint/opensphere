goog.provide('plugin.places.ui.SavePlacesCtrl');
goog.provide('plugin.places.ui.savePlacesDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.ex.ExportOptionsCtrl');
goog.require('os.ui.im.basicInfoDirective');
goog.require('plugin.places');


/**
 * Save places directive.
 * @return {angular.Directive}
 */
plugin.places.ui.savePlacesDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'initSources': '&'
    },
    templateUrl: os.ROOT + 'views/plugin/places/saveplaces.html',
    controller: plugin.places.ui.SavePlacesCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('saveplaces', [plugin.places.ui.savePlacesDirective]);


/**
 * Launch a dialog to save places from a source.
 * @param {os.source.Vector} source The source
 */
plugin.places.ui.launchSavePlaces = function(source) {
  var windowId = 'savePlaces';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var scopeOptions = {
      'initSources': source ? [source] : undefined
    };

    var windowOptions = {
      'id': windowId,
      'label': 'Save to Places',
      'icon': 'fa ' + plugin.places.ICON,
      'x': 'center',
      'y': 'center',
      'width': 425,
      'min-width': 300,
      'max-width': 800,
      'height': 'auto',
      'show-close': true
    };

    var template = '<saveplaces init-sources="initSources"></saveplaces>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};



/**
 * Controller for the save places dialog.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.ex.ExportOptionsCtrl}
 * @constructor
 * @ngInject
 */
plugin.places.ui.SavePlacesCtrl = function($scope, $element) {
  plugin.places.ui.SavePlacesCtrl.base(this, 'constructor', $scope);

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {!Object}
   */
  this['config'] = {
    'title': '',
    'description': '',
    'tags': '',
    'features': []
  };

  /**
   * @type {!Array<!os.data.ColumnDefinition>}
   */
  this['columns'] = [];

  /**
   * @type {string}
   */
  this['titleSample'] = '';

  /**
   * @type {string}
   */
  this['descSample'] = '';

  /**
   * @type {!Object<string, string>}
   */
  this['help'] = {
    'title': 'Custom title given to all saved places.',
    'titleColumn': 'Column used to apply titles to all saved places. If a selected item doesn\'t have this field ' +
        'defined, a generic title will be given. You may also choose to apply a custom title to new places.',
    'description': 'Description applied to all saved places.',
    'descColumn': 'Column used to apply descriptions to all saved places. If a selected item doesn\'t have this ' +
        'field defined, the description will be left blank. You may also choose to apply a custom description to new ' +
        'places.',
    'tags': 'Comma-delimited list of tags to apply to all saved places. Tags can be used to group or search ' +
        'places in the Layers tab of the Layers window.',
    'tagsColumn': 'Column used to apply tags to all saved places. Tags can be used to group or search places ' +
        'in the Layers tab of the Layers window.  If an item doesn\'t have this field defined, the tags will be left ' +
        'blank. You may also choose to provide your own custom tags.'
  };

  $scope.$on(os.ui.ex.ExportOptionsEvent.CHANGE, this.onOptionsChange_.bind(this));

  setTimeout(function() {
    $scope.$emit('window.ready');
  }, 0);
};
goog.inherits(plugin.places.ui.SavePlacesCtrl, os.ui.ex.ExportOptionsCtrl);


/**
 * @inheritDoc
 */
plugin.places.ui.SavePlacesCtrl.prototype.disposeInternal = function() {
  plugin.places.ui.SavePlacesCtrl.base(this, 'disposeInternal');

  this.element = null;
};


/**
 * Close the window.
 */
plugin.places.ui.SavePlacesCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(
    plugin.places.ui.SavePlacesCtrl.prototype,
    'cancel',
    plugin.places.ui.SavePlacesCtrl.prototype.cancel);


/**
 * Save selection to places and close the window.
 */
plugin.places.ui.SavePlacesCtrl.prototype.confirm = function() {
  plugin.places.saveFromSource(this['config']);

  // notify that places were saved to the layer so the user knows where to look
  var plural = this['count'] > 1 ? 's' : '';
  var msg = 'Added ' + this['count'] + ' feature' + plural + ' to the ' + plugin.places.TITLE + ' layer.';
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);

  this.cancel();
};
goog.exportProperty(
    plugin.places.ui.SavePlacesCtrl.prototype,
    'confirm',
    plugin.places.ui.SavePlacesCtrl.prototype.confirm);


/**
 * @inheritDoc
 */
plugin.places.ui.SavePlacesCtrl.prototype.includeSource = function(source) {
  return source.getId() != plugin.places.ID;
};


/**
 * Handle changes to the selected sources.
 * @param {angular.Scope.Event} event
 * @param {Array<!ol.Feature>} items
 * @param {Array<!os.source.Vector>} sources
 * @private
 */
plugin.places.ui.SavePlacesCtrl.prototype.onOptionsChange_ = function(event, items, sources) {
  event.stopPropagation();

  if (this['config']) {
    if (this['config']['features']) {
      this['config']['features'].length = 0;

      // update the export items
      if (items && items.length > 0) {
        this['config']['features'] = this['config']['features'].concat(items);
      }
    }

    // update the displayed columns
    this['columns'] = sources && sources.length > 0 ? sources[0].getColumns().slice() : [];
    this['columns'].sort(os.ui.slick.column.nameCompare);
  }
};
