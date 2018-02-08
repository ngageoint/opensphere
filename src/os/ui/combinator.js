goog.provide('os.ui.CombinatorCtrl');
goog.provide('os.ui.combinatorDirective');

goog.require('os.command.CommandProcessor');
goog.require('os.command.SequenceCommand');
goog.require('os.defines');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.ui.Module');
goog.require('os.ui.addFilterDirective');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.filter.ui.filterExportDirective');
goog.require('os.ui.query.cmd.FilterAdd');
goog.require('os.ui.query.cmd.FilterRemove');
goog.require('os.ui.query.ui.CombinatorCtrl');
goog.require('os.ui.query.ui.combinatorDirective');
goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.window');


/**
 * The combinator window directive
 * @return {angular.Directive}
 */
os.ui.combinatorDirective = function() {
  var dir = os.ui.query.ui.combinatorDirective();
  dir.controller = os.ui.CombinatorCtrl;
  dir.templateUrl = os.ROOT + 'views/windows/combinator.html';
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('osCombinator', [os.ui.combinatorDirective]);



/**
 * Controller for combinator window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.query.ui.CombinatorCtrl}
 * @constructor
 * @ngInject
 */
os.ui.CombinatorCtrl = function($scope, $element) {
  os.ui.CombinatorCtrl.base(this, 'constructor', $scope, $element);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.ADD, this.scheduleUpdate, false, this);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.REMOVE, this.scheduleUpdate, false, this);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.RENAME, this.scheduleUpdate, false, this);
  os.ui.filterManager.listen(os.ui.filter.FilterEventType.EXPORT_FILTER, this.launchExport, false, this);
};
goog.inherits(os.ui.CombinatorCtrl, os.ui.query.ui.CombinatorCtrl);


/**
 * @inheritDoc
 */
os.ui.CombinatorCtrl.prototype.updateLayers = function() {
  if (this.scope['hideLayerChooser'] && this.scope['layerId']) {
    var layerId = /** @type {string} */ (this.scope['layerId']);
    var layers = [];
    var layer = null;
    var filterable = os.ui.filterManager.getFilterable(layerId);

    if (filterable) {
      try {
        var cols = filterable.getFilterColumns();

        if (cols) {
          layer = {
            'id': layerId,
            'label': filterable.getTitle(),
            'columns': cols
          };
          layers.push(layer);
        }
      } catch (e) {

      }
    }

    this.scope['layers'] = layers;
    this.scope['layer'] = layer;
    return;
  }

  os.ui.CombinatorCtrl.base(this, 'updateLayers');
};


/**
 * @inheritDoc
 */
os.ui.CombinatorCtrl.prototype.onDestroy = function() {
  os.ui.CombinatorCtrl.base(this, 'onDestroy');
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.ADD, this.scheduleUpdate, false, this);
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.REMOVE, this.scheduleUpdate, false, this);
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.RENAME, this.scheduleUpdate, false, this);
  os.ui.filterManager.unlisten(os.ui.filter.FilterEventType.EXPORT_FILTER, this.launchExport, false, this);
};


/**
 * @inheritDoc
 */
os.ui.CombinatorCtrl.prototype.editEntry = function(entry) {
  if (entry) {
    var fqm = os.ui.filterManager;
    var original = fqm.getFilter(entry.getId());

    if (original) {
      // edit
      var rm = new os.ui.query.cmd.FilterRemove(original);
      var add = new os.ui.query.cmd.FilterAdd(entry);
      var edit = new os.command.SequenceCommand();
      edit.setCommands([rm, add]);
      this.doCommand(edit);
    } else {
      // add
      this.doCommand(new os.ui.query.cmd.FilterAdd(entry));
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.CombinatorCtrl.prototype.doCommand = function(cmd) {
  os.command.CommandProcessor.getInstance().addCommand(cmd);
};


/**
 * Launches the filter/combinator dialog if it is not already open.
 */
os.ui.CombinatorCtrl.launch = function() {
  var label = 'Advanced';
  var openWindows = angular.element('div[label="' + label + '"].window');

  if (!openWindows.length) {
    var windowOptions = {
      'label': label,
      'key': 'filters',
      'icon': 'fa fa-filter',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 520,
      'show-close': true,
      'no-scroll': true,
      'min-width': 300,
      'max-width': 1000,
      'min-height': 200,
      'max-height': 1000
    };

    var scope = {
      'layerId': undefined
    };

    var template = '<os-combinator layer-id="layerId" hide-layer-chooser="hideChooser"></os-combinator>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    os.ui.window.bringToFront('filters');
  }
};


/**
 * Launches a combinator explicitly for the passed in layer ID.
 * @param {string} layerId Layer ID for the combinator
 * @param {string=} opt_layerName Optional name to include
 */
os.ui.CombinatorCtrl.launchForLayer = function(layerId, opt_layerName) {
  var label = 'Filters';
  var windowId = os.ui.sanitizeId('filters-' + layerId);

  if (!os.ui.window.exists(windowId)) {
    if (opt_layerName) {
      label += ' for ' + opt_layerName;
    } else {
      // no layer name specified, so try to assemble one to provide context
      var title = os.layer.getTitle(layerId, true);
      if (title) {
        label += ' for ' + title;
      }
    }

    var windowOptions = {
      'id': windowId,
      'label': label,
      'key': windowId,
      'icon': 'fa fa-filter',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 520,
      'show-close': true,
      'no-scroll': true,
      'min-width': 300,
      'max-width': 1000,
      'min-height': 200,
      'max-height': 1000
    };

    var scope = {
      'layerId': layerId,
      'hideChooser': true
    };

    var template = '<os-combinator layer-id="layerId" hide-layer-chooser="hideChooser"></os-combinator>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    os.ui.window.bringToFront(windowId);
  }
};
