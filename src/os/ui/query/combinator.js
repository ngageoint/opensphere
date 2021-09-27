goog.declareModuleId('os.ui.query.CombinatorUI');

import FilterEventType from '../filter/filtereventtype.js';
import Module from '../module.js';
import {sanitizeId} from '../ui.js';
import {bringToFront, create, exists} from '../window.js';
import {Controller as BaseCombinatorCtrl, directive as baseCombinatorDirective} from './basecombinator.js';
import FilterAdd from './cmd/filteraddcmd.js';
import FilterRemove from './cmd/filterremovecmd.js';

const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const LayerEventType = goog.require('os.events.LayerEventType');
const {getTitle} = goog.require('os.layer');
const {getMapContainer} = goog.require('os.map.instance');


/**
 * The combinator window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = baseCombinatorDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'combinator';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * The controller for the combinator window. This implements the combinator's interface with the map container.
 * @unrestricted
 */
export class Controller extends BaseCombinatorCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    getMapContainer().listen(LayerEventType.ADD, this.scheduleUpdate, false, this);
    getMapContainer().listen(LayerEventType.REMOVE, this.scheduleUpdate, false, this);
    getMapContainer().listen(LayerEventType.RENAME, this.scheduleUpdate, false, this);
    this.fm.listen(FilterEventType.EXPORT_FILTER, this.launchExport, false, this);
  }

  /**
   * @inheritDoc
   */
  updateLayers() {
    if (this.scope['hideLayerChooser'] && this.scope['layerId']) {
      var layerId = /** @type {string} */ (this.scope['layerId']);
      var layers = [];
      var layer = null;
      var filterable = this.fm.getFilterable(layerId);

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

    super.updateLayers();
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();
    getMapContainer().unlisten(LayerEventType.ADD, this.scheduleUpdate, false, this);
    getMapContainer().unlisten(LayerEventType.REMOVE, this.scheduleUpdate, false, this);
    getMapContainer().unlisten(LayerEventType.RENAME, this.scheduleUpdate, false, this);
    this.fm.unlisten(FilterEventType.EXPORT_FILTER, this.launchExport, false, this);
  }

  /**
   * @inheritDoc
   */
  editEntry(entry) {
    if (entry) {
      var fqm = this.fm;
      var original = fqm.getFilter(entry.getId());

      if (original) {
        // edit
        var rm = new FilterRemove(original);
        var add = new FilterAdd(entry);
        var edit = new SequenceCommand();
        edit.setCommands([rm, add]);
        this.doCommand(edit);
      } else {
        // add
        this.doCommand(new FilterAdd(entry));
      }
    }
  }

  /**
   * @inheritDoc
   */
  doCommand(cmd) {
    CommandProcessor.getInstance().addCommand(cmd);
  }
}

/**
 * Launches the filter/combinator dialog if it is not already open.
 */
export const launch = () => {
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
      'min-width': 300,
      'max-width': 1000,
      'min-height': 200,
      'max-height': 1000
    };

    var scope = {
      'layerId': undefined
    };

    var template = '<combinator layer-id="layerId" hide-layer-chooser="hideChooser"></combinator>';
    create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    bringToFront('filters');
  }
};

/**
 * Launches a combinator explicitly for the passed in layer ID.
 *
 * @param {string} layerId Layer ID for the combinator
 * @param {string=} opt_layerName Optional name to include
 */
export const launchForLayer = (layerId, opt_layerName) => {
  var label = 'Filters';
  var windowId = sanitizeId('filters-' + layerId);

  if (!exists(windowId)) {
    if (opt_layerName) {
      label += ' for ' + opt_layerName;
    } else {
      // no layer name specified, so try to assemble one to provide context
      var title = getTitle(layerId, true);
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
      'min-width': 300,
      'max-width': 1000,
      'min-height': 200,
      'max-height': 1000
    };

    var scope = {
      'layerId': layerId,
      'hideChooser': true
    };

    var template = '<combinator layer-id="layerId" hide-layer-chooser="hideChooser"></combinator>';
    create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    bringToFront(windowId);
  }
};
