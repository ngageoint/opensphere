goog.declareModuleId('os.ui.query.BaseCombinatorUI');

import '../slick/slicktree.js';
import './addfilter.js';
import {ROOT} from '../../os.js';
import FilterEventType from '../filter/filtereventtype.js';
import * as FilterExportUI from '../filter/ui/filterexport.js';
import FilterExportChoice from '../filter/ui/filterexportchoice.js';
import * as areaImport from '../menu/areaimportmenu.js';
import {apply} from '../ui.js';
import {close} from '../window.js';
import AreaRemove from './cmd/arearemovecmd.js';
import FilterAdd from './cmd/filteraddcmd.js';
import FilterRemove from './cmd/filterremovecmd.js';
import QueryEntries from './cmd/queryentriescmd.js';
import {ALL_ID} from './query.js';

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const {caseInsensitiveCompare} = goog.require('goog.string');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const Settings = goog.require('os.config.Settings');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const BaseFilterManager = goog.require('os.filter.BaseFilterManager');
const Metrics = goog.require('os.metrics.Metrics');
const {Filters} = goog.require('os.metrics.keys');
const {launchQueryImport} = goog.require('os.query');
const BaseAreaManager = goog.require('os.query.BaseAreaManager');
const {getAreaManager, getFilterManager, getQueryManager} = goog.require('os.query.instance');
const TriState = goog.require('os.structs.TriState');

const FilterEntry = goog.requireType('os.filter.FilterEntry');
const BaseQueryManager = goog.requireType('os.query.BaseQueryManager');
const {default: ComboNode} = goog.requireType('os.ui.query.ComboNode');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The base combinator directive. This directive is NOT registered with Angular, it is only used by the extending
 * combinator implementations.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'layerId': '=',
    'updateImmediate': '=?',
    'hideAdvanced': '=?',
    'hideLayerChooser': '=?',
    'queryManager': '=?',
    'filterManager': '=?',
    'areaManager': '=?'
  },
  templateUrl: ROOT + 'views/query/combinator.html',
  controller: Controller,
  controllerAs: 'comboCtrl'
});

/**
 * The base combinator controller. This implements the majority of the interface with the area, filter and query
 * managers as well as the tree UI sync.
 *
 * This implementation does NOT interface with the map!
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?Array<Object<string, string|boolean>>}
     * @private
     */
    this.entries_ = null;

    /**
     * @type {string}
     * @private
     */
    this.lastOrder_ = '';

    /**
     * @type {Delay}
     * @private
     */
    this.updateDelay_ = new Delay(this.update, 50, this);

    /**
     * @type {Delay}
     * @private
     */
    this.applyDelay_ = new Delay(this.apply, 50, this);

    /**
     * @type {Object<string, boolean>}
     * @private
     */
    this.dirty_ = {};

    /**
     * @type {boolean}
     * @protected
     */
    this.applyImmediate = $scope['updateImmediate'] === true;

    /**
     * Query manager reference used by this combinator;
     * @type {BaseQueryManager}
     */
    this.qm = $scope['queryManager'] || getQueryManager();

    /**
     * Area manager reference used by this combinator;
     * @type {BaseAreaManager}
     */
    this.am = $scope['areaManager'] || getAreaManager();

    /**
     * Filter manager reference used by this combinator;
     * @type {BaseFilterManager}
     */
    this.fm = $scope['filterManager'] || getFilterManager();

    $scope['advanced'] = !$scope['hideAdvanced'] && this.qm.hasActiveExplicitEntries();
    var orders = Controller.ORDERS_;
    $scope['orders'] = orders;

    $scope['order'] = Settings.getInstance().get(['filter', 'groupBy'], orders[orders.length - 1]);

    $scope['layer'] = null;
    $scope['layers'] = [];
    $scope['hideLayerChooser'] = !!$scope['hideLayerChooser'];
    // make sure a country border layer has been configured before showing the button
    $scope['hasCountrySupport'] = false;

    $scope.$on('$destroy', this.onDestroy.bind(this));
    $scope.$on('dirty', this.onDirty.bind(this));
    $scope.$on('edit', this.onEdit_.bind(this));
    $scope.$on('view', this.onView_.bind(this));
    $scope.$on('copy', this.onCopy_.bind(this));
    $scope.$on('remove', this.onRemove.bind(this));
    $scope.$on('filterComplete', this.onFilterComplete_.bind(this));
    $scope.$on('combinator.setLayer', this.onSetLayer_.bind(this));

    if (this.applyImmediate) {
      $scope.$on('combinator.apply', this.apply.bind(this));
    }

    this.update();

    this.fm.listen(FilterEventType.FILTERS_REFRESH, this.scheduleUpdate, false, this);
    this.fm.listen(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);
    this.am.listen(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);
    this.qm.listen(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);
  }

  /**
   * Applies the entries to the query manager
   *
   * @export
   */
  apply() {
    this.createEntriesFromTree();
    var entries = this.getEntries();

    // filter entries to current layer id and don't merge if layerId == 'all'!
    var layerId = this.getLayerId_(ALL_ID);
    var merge = layerId !== ALL_ID;
    if (merge) {
      entries = entries.filter(function(item) {
        return item['layerId'] === layerId || item['layerId'] === '*';
      });
    }

    entries = entries.filter(function(item) {
      return !('disabled' in item);
    });

    var cmd = new QueryEntries(entries, merge, layerId, true);
    this.doCommand(cmd);
    Metrics.getInstance().updateMetric(Filters.ADVANCED_APPLY, 1);
    this.scope.$emit('combinator.applycomplete');
  }

  /**
   * Closes the window
   *
   * @export
   */
  close() {
    close(this.element);
    Metrics.getInstance().updateMetric(Filters.ADVANCED_CLOSE, 1);
  }

  /**
   * Clear
   *
   * @export
   */
  clear() {
    var root = /** @type {ComboNode} */ (this.scope['pivots']);

    if (root) {
      root.setState(TriState.OFF);
    }

    this.onDirty();
    Metrics.getInstance().updateMetric(Filters.ADVANCED_RESET, 1);
  }

  /**
   * Get the currently configured layer id.
   *
   * @param {string=} opt_default The default value.
   * @return {string|undefined}
   * @private
   */
  getLayerId_(opt_default) {
    var layerId;

    // always use the layerId value if the layer chooser is hidden
    if (this.scope) {
      if (!this.scope['hideLayerChooser'] && this.scope['layer']) {
        layerId = /** @type {string|undefined} */ (this.scope['layer']['id']);
      } else {
        layerId = /** @type {string|undefined} */ (this.scope['layerId']);
      }
    }

    return layerId || opt_default;
  }

  /**
   * @return {!Array<Object<string, string|boolean>>}
   * @protected
   */
  getEntries() {
    if (!this.entries_) {
      this.entries_ = this.getGoldCopy_();
    }

    return this.entries_;
  }

  /**
   * Clean up
   *
   * @protected
   */
  onDestroy() {
    this.fm.unlisten(FilterEventType.FILTERS_REFRESH, this.scheduleUpdate, false, this);
    this.fm.unlisten(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);
    this.am.unlisten(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);
    this.qm.unlisten(GoogEventType.PROPERTYCHANGE, this.scheduleUpdate, false, this);

    dispose(this.updateDelay_);
    this.updateDelay_ = null;

    dispose(this.applyDelay_);
    this.applyDelay_ = null;

    this.disposeTree_();
    this.scope = null;
    this.element = null;
  }

  /**
   * Performs a command. Useful for extending classes that may want to use the command stack.
   *
   * @param {os.command.ICommand} cmd
   * @protected
   */
  doCommand(cmd) {
    cmd.execute();
  }

  /**
   * Schedules an update
   *
   * @param {goog.events.Event} e
   */
  scheduleUpdate(e) {
    var updateTimer = true;
    if (e.getProperty) {
      var p = e.getProperty();
      if (p == 'featureHovered') {
        updateTimer = false;
        var guid = e.getNewValue();
        if (guid) {
          this.scope['selected'] = [];
          this.selectById(guid);
        }
      }
    }
    if (updateTimer) {
      this.updateDelay_.start();
    }
  }

  /**
   * Disposes the tree
   *
   * @private
   */
  disposeTree_() {
    var tree = this.getRoot();

    if (tree) {
      tree.dispose();
    }
  }

  /**
   * Return the pivot data from the query manager
   *
   * @param {Array<!string>=} opt_order
   * @param {boolean=} opt_advanced
   * @param {Object=} opt_layer
   * @return {ComboNode}
   */
  getPivotData(opt_order, opt_advanced, opt_layer) {
    return /** @type {ComboNode} */ (this.qm.getPivotData(opt_order, undefined, undefined, !opt_advanced, opt_layer));
  }

  /**
   * Updates the tree data.
   *
   * @param {boolean=} opt_restoreState If state should be restored for tree nodes
   * @export
   */
  update(opt_restoreState) {
    var advanced = /** @type {boolean} */ (this.scope['advanced']);
    var defaultOrder = Controller.ORDERS_[Controller.ORDERS_.length - 2];

    var orderStr = advanced ? /** @type {string} */ (this.scope['order']) : defaultOrder;
    var order = orderStr.split(' - ');

    if (orderStr === this.lastOrder_) {
      // the group by isn't changing, so we should attempt to maintain the
      // state of the tree
      var root = /** @type {ComboNode} */ (this.scope['pivots']);

      /**
       * @type {Object<string, boolean>}
       */
      var collapseState = {};
      this.doState(root, collapseState);
    }

    this.updateLayers();
    this.createEntriesFromTree();
    this.disposeTree_();

    var layer = this.scope['hideLayerChooser'] ? this.scope['layer'] : undefined;
    root = this.getPivotData(order, advanced, layer);
    root = this.filterRoot_(root);
    this.scope['pivots'] = root;

    this.applyEntries(opt_restoreState);

    if (collapseState) {
      this.doState(root, collapseState, true, opt_restoreState);
    }

    if (!advanced) {
      var children = root.getChildren();
      if (!children || children.length == 0) {
        root.setLabel('No layers');
        root.setCheckboxVisible(false);
      }
    }

    apply(this.scope);

    // save the order
    Settings.getInstance().set(['filter', 'groupBy'], orderStr);
    this.lastOrder_ = orderStr;
  }

  /**
   * Handles user layer selection
   *
   * @param {boolean=} opt_restoreState If state should be restored for tree nodes
   * @export
   */
  selectLayer(opt_restoreState) {
    Metrics.getInstance().updateMetric(Filters.ADVANCED_SELECT_LAYER, 1);
    this.update(opt_restoreState);
  }

  /**
   * Handles user groupBy selection
   *
   * @param {boolean=} opt_restoreState If state should be restored for tree nodes
   * @export
   */
  selectGroupBy(opt_restoreState) {
    Metrics.getInstance().updateMetric(Filters.GROUP_BY, 1);
    this.update(opt_restoreState);
  }

  /**
   * Traverse through the tree and select the nodes that match an id
   *
   * @param {string} id
   * @param {SlickTreeNode=} opt_node
   */
  selectById(id, opt_node) {
    if (!opt_node) {
      opt_node = this.getRoot();
      var fire = true;
    }

    var children = opt_node.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        if (children[i].getId() == id) {
          this.scope['selected'].push(children[i]);
        }
        this.selectById(id, /** @type {SlickTreeNode} */ (children[i]));
      }
    }
    if (fire && this.scope['selected'].length > 0) {
      apply(this.scope);
      opt_node.dispatchEvent(new PropertyChangeEvent('scrollRowIntoView', this.scope['selected'][0].id));
    }
  }

  /**
   * Handles toggle of advancde check box
   *
   * @param {boolean=} opt_restoreState If state should be restored for tree nodes
   * @export
   */
  advancedToggle(opt_restoreState) {
    Metrics.getInstance().updateMetric(Filters.ADVANCED_TOGGLE, 1);
    this.update(opt_restoreState);
  }

  /**
   * Handle scope event to switch the selected layer.
   *
   * @param {angular.Scope.Event} event
   * @param {string} id The layer id
   * @private
   */
  onSetLayer_(event, id) {
    if (this.scope && id) {
      var layer = this.scope['layers'].find(function(l) {
        return l['id'] === id;
      });

      if (layer) {
        this.scope['layer'] = layer;
        this.update(true);
      }
    }
  }

  /**
   * Updates the list of layers in the combo box
   *
   * @protected
   */
  updateLayers() {
    var qm = this.qm;
    var set = qm.getLayerSet();
    var layers = [];
    // if the chooser is hidden, always use the layerId on the scope
    var layer = this.scope['hideLayerChooser'] ?
      this.scope['layerId'] : (this.scope['layer'] || this.scope['layerId']);

    for (var key in set) {
      var filterable = /** @type {os.filter.IFilterable} */ (this.fm.getFilterable(key));

      try {
        if (filterable) {
          var cols = filterable.getFilterColumns();

          if (cols) {
            layers.push({
              'id': key,
              'label': set[key],
              'columns': cols
            });

            if (layer && (layer['id'] === key || layer === key)) {
              layer = layers[layers.length - 1];
            }
          }
        }
      } catch (e) {
        // most likely, layer wasn't an IFilterable implementation
      }
    }

    layers.sort(Controller.sortLayers);

    layers.unshift({
      'id': null,
      'label': 'All'
    });

    if (!layer || !layer['id']) {
      layer = layers[0];
    }

    var layerChanged = this.scope['layer'] ? this.scope['layer']['id'] === layer['id'] : true;

    this.scope['layers'] = layers;
    this.scope['layer'] = layer;

    if (layerChanged) {
      this.scope.$broadcast('layerChanged', this.scope['layer']['id']);
    }
  }

  /**
   * Filters the tree down to the given layer ID. If the ID is not found, the tree
   * will not be filtered.
   *
   * @param {ComboNode} root
   * @param {boolean=} opt_changeRoot
   * @return {ComboNode}
   * @private
   */
  filterRoot_(root, opt_changeRoot) {
    opt_changeRoot = opt_changeRoot !== undefined ? opt_changeRoot : true;

    var changed = false;
    var layerId = this.getLayerId_();
    if (layerId) {
      var children = root.getChildren();

      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          var child = /** @type {ComboNode} */ (children[i]);
          var entry = child.getEntry();

          if (entry && entry['layerId'] === layerId) {
            changed = true;

            if (opt_changeRoot) {
              // since we are on the first level, we can just disconnect this whole portion
              // of the tree and use that as the root

              // save the old root
              var oldRoot = root;
              // remove the child from the tree
              // note that child.setParent(null) removes the parent reference but doesn't remove the child from the parent
              child.getParent().removeChild(child);

              // change the root
              root = child;
              // ditch the old tree
              oldRoot.dispose();
            } else {
              // in this case, we just need to get rid of siblings
              i = children.length;
              while (i--) {
                if (children[i] !== child) {
                  // remove the child to make sure the tree state is updated appropriately
                  root.removeChild(children[i]);
                }
              }
            }

            break;
          }
        }

        if (!changed) {
          for (i = 0, n = children.length; i < n; i++) {
            this.filterRoot_(/** @type {ComboNode} */ (children[i]), false);
          }
        }
      }
    }

    return root;
  }

  /**
   * @return {?ComboNode}
   * @protected
   */
  getRoot() {
    return /** @type {ComboNode} */ (this.scope['pivots']);
  }

  /**
   * Traverses the ComboNode tree and builds out the set of entries from it. Places the reference on this.entries_
   *
   * @protected
   */
  createEntriesFromTree() {
    var tree = this.getRoot();

    if (tree) {
      this.entries_ = [];
      this.parseEntries(tree, this.entries_);
    }
  }

  /**
   * @return {!Array<!Object<string, string|boolean>>}
   * @private
   */
  getGoldCopy_() {
    return this.qm.getEntries(null, null, null, true);
  }

  /**
   * Applies saved entries to the tree. When an external change to the query entries in queryManager is made, this
   * function will be called without attempting to restore the state. This situation arises when, say, a query
   * area is changed from inclusion to exclusion on the map.
   *
   * @param {boolean=} opt_restoreState Controls whether to restore the tree state
   * @protected
   */
  applyEntries(opt_restoreState) {
    var entries = undefined;

    if (opt_restoreState) {
      entries = this.getEntries();

      if (entries && entries.length) {
        // merge new items in the gold list with the entries list
        var goldList = this.getGoldCopy_();
        var layerIds = {};
        var areaIds = {};
        var filterIds = {};

        for (var i = 0, n = entries.length; i < n; i++) {
          layerIds[entries[i]['layerId']] = true;
          areaIds[entries[i]['areaId']] = true;
          filterIds[entries[i]['filterId']] = true;
        }

        for (i = 0, n = goldList.length; i < n; i++) {
          var e = goldList[i];

          if (!(e['layerId'] in layerIds) || !(e['areaId'] in areaIds) || !(e['filterId'] in filterIds)) {
            entries.push(e);
          }
        }

        entries = entries.filter(function(item) {
          return !('disabled' in item);
        });
      }
    }

    entries = this.qm.getExpanded(entries);
    var tree = this.getRoot();

    if (tree) {
      Controller.applyEntries(tree, entries, undefined, this.scope['advanced']);
    }
  }

  /**
   *@protected
   */
  onDirty() {
    var layerId = this.getLayerId_(ALL_ID);
    if (layerId) {
      this.dirty_[layerId] = true;

      if (this.applyImmediate) {
        this.apply();
      }
    }
  }

  /**
   * @param {angular.Scope.Event} evt
   * @param {boolean} isFilter
   * @param {!Object<string, string|boolean>} entry
   * @private
   */
  onEdit_(evt, isFilter, entry) {
    var field = isFilter ? 'filterId' : 'areaId';
    if (entry) {
      var id = /** @type {string} */ (entry[field]);

      if (id) {
        if (isFilter) {
          var fm = this.fm;
          var filter = fm.getFilter(id);

          if (filter) {
            var layerId = /** @type {string} */ (entry['layerId']);
            var layer = this.scope['layers'].find(function(layer) {
              return layer['id'] == layerId;
            });

            var columns = layer && layer['columns'] || null;
            if (columns) {
              BaseFilterManager.edit(layerId, columns, this.onEditComplete_.bind(this), filter);
            } else {
              // if columns aren't available the filter edit is going to fail wildly, so don't allow it
              AlertManager.getInstance().sendAlert('This layer is missing required information to edit filters.',
                  AlertEventSeverity.WARNING);
            }
          }
        } else {
          var am = this.am;
          var area = am.get(id);

          if (area) {
            BaseAreaManager.save(area);
          }
        }
      }
    }
  }

  /**
   * @param {angular.Scope.Event} evt
   * @param {boolean} isFilter
   * @param {!Object<string, string|boolean>} entry
   * @private
   */
  onView_(evt, isFilter, entry) {
    var field = isFilter ? 'filterId' : 'areaId';
    if (entry) {
      var id = /** @type {string} */ (entry[field]);

      if (id) {
        if (isFilter) {
          var fm = this.fm;
          var filter = fm.getFilter(id);

          if (filter) {
            var layerId = /** @type {string} */ (entry['layerId']);
            var layer = this.scope['layers'].find(function(layer) {
              return layer['id'] == layerId;
            });

            var columns = layer && layer['columns'] || null;
            if (columns) {
              BaseFilterManager.view(layerId, columns, this.onEditComplete_.bind(this), filter);
            } else {
              // if columns aren't available the filter edit is going to fail wildly, so don't allow it
              AlertManager.getInstance().sendAlert('This layer is missing required information to edit filters.',
                  AlertEventSeverity.WARNING);
            }
          }
        } else { // Only filters are available for view, so don't allow it
          AlertManager.getInstance().sendAlert('Viewing areas is not allowed at this time.',
              AlertEventSeverity.WARNING);
        }
      }
    }
  }

  /**
   * Listener for copy events from combo nodes.
   *
   * @param {angular.Scope.Event} event
   * @param {!Object<string, string|boolean>} entry
   * @private
   */
  onCopy_(event, entry) {
    if (entry) {
      var id = /** @type {string} */ (entry['filterId']);
      if (id) {
        var filter = this.fm.getFilter(id);
        if (filter) {
          BaseFilterManager.copy(filter, /** @type {string} */ (entry['layerId']));
        }
      }
    }
  }

  /**
   * @param {angular.Scope.Event} evt
   * @param {boolean} isFilter
   * @param {!Object<string, string|boolean>} entry
   * @protected
   */
  onRemove(evt, isFilter, entry) {
    var field = isFilter ? 'filterId' : 'areaId';
    if (entry) {
      var id = /** @type {string} */ (entry[field]);

      if (id) {
        if (isFilter) {
          var fm = this.fm;
          var filter = fm.getFilter(id);

          if (filter) {
            var cmd = new FilterRemove(filter);
            this.doCommand(cmd);
          }
        } else {
          var am = this.am;
          var area = am.get(id);

          if (area) {
            cmd = new AreaRemove(area);
            this.doCommand(cmd);
          }
        }
      }

      if (this.applyImmediate) {
        this.scope.$emit('dirty');
        this.apply();
      }
    }
  }

  /**
   * @param {boolean} collapsed
   * @param {SlickTreeNode=} opt_node
   */
  toggle(collapsed, opt_node) {
    if (!opt_node) {
      var fire = true;
      opt_node = this.getRoot();
    }

    if (opt_node) {
      if (opt_node.getParent()) {
        opt_node.collapsed = collapsed;
      }

      var children = opt_node.getChildren();
      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          this.toggle(collapsed, /** @type {SlickTreeNode} */ (children[i]));
        }
      }
    }

    if (fire) {
      opt_node.dispatchEvent(new PropertyChangeEvent('children'));
    }
    // metrics
    if (collapsed) {
      Metrics.getInstance().updateMetric(Filters.ADVANCED_COLLAPSE_ALL, 1);
    } else {
      Metrics.getInstance().updateMetric(Filters.ADVANCED_EXPAND_ALL, 1);
    }
  }

  /**
   * @param {!ComboNode} node
   * @param {!Array<!Object<string, string|boolean>>} entries
   * @param {Object<string, string|boolean>=} opt_entry
   */
  parseEntries(node, entries, opt_entry) {
    if (node) {
      var item = node.getEntry();
      var entry = opt_entry ? Object.assign({}, opt_entry) : Controller.getDefaultEntry();

      // apply this node's stuff to the entry
      if (item && entry) {
        for (var key in item) {
          entry[key] = item[key];
        }
      }

      if (node.getState() === TriState.OFF) {
        entry['disabled'] = true;
        var areaId = /** @type {string} */ (entry['areaId']);
        var layerId = /** @type {string} */ (entry['layerId']);

        if (areaId && areaId !== '*' && layerId) {
          // see if this area is a double wildcard
          var result = this.qm.getEntries('*', areaId, '*');

          if (result && result.length) {
            delete entry['disabled'];
            entry['negate'] = true;
            entries.push(entry);
            // we're done
            return;
          }
        }
      }

      var children = node.getChildren();
      if (!children || !children.length) {
        // This is the leaf. Save the entry.
        entries.push(entry);
      }

      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          this.parseEntries(
              /** @type {!ComboNode} */ (children[i]), entries, entry);
        }
      }
    }
  }

  /**
   * Saves or applies tree collapse state
   *
   * @param {ComboNode} node
   * @param {Object<string, boolean>} collapsed
   * @param {boolean=} opt_apply
   * @param {boolean=} opt_restoreState If state should be restored for tree nodes, or if they should default to ON.
   */
  doState(node, collapsed, opt_apply, opt_restoreState) {
    var restoreState = opt_restoreState || false;

    if (node) {
      var ids = [];
      var p = node;
      while (p) {
        ids.unshift(p.getId());
        p = p.getParent();
      }

      var id = ids.join('.');

      if (opt_apply) {
        if (id in collapsed) {
          node.collapsed = collapsed[id];
        } else if (this.applyImmediate) {
          // This is to force new filters to be checked by default.
          var entry = node.getEntry();
          if (!restoreState && entry &&
              (('filterId' in entry && entry['filterId'] != '*') || ('areaId' in entry && entry['areaId'] != '*'))) {
            node.setState(TriState.ON);

            // don't call apply directly here, start the delay to debounce as this gets called a bunch
            this.applyDelay_.start();
          }
        }
      } else {
        collapsed[id] = node.collapsed;
      }

      var children = node.getChildren();
      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          this.doState(
              /** @type {ComboNode} */ (children[i]), collapsed, opt_apply, opt_restoreState);
        }
      }
    }
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {FilterEntry} entry
   * @protected
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
        edit.title = 'Edit Filter ' + entry.getTitle();
        this.doCommand(edit);
      } else {
        // add
        entry.setTemporary(true);
        this.doCommand(new FilterAdd(entry));
      }
    }
  }

  /**
   * Handles 'filterComplete' Angular scope event.
   *
   * @param {angular.Scope.Event} event
   * @param {FilterEntry} entry
   * @private
   */
  onFilterComplete_(event, entry) {
    event.stopPropagation();
    this.onEditComplete_(entry);
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {FilterEntry} entry
   * @private
   */
  onEditComplete_(entry) {
    this.editEntry(entry);
    this.scope.$emit('dirty');
  }

  /**
   * Save the filters to a file
   *
   * @param {string} name of the file
   * @param {FilterExportChoice} mode how to export filters
   * @private
   */
  save_(name, mode) {
    var filters = [];
    if (mode != FilterExportChoice.SELECTED) {
      Controller.flatten_(this.scope['pivots'].getChildren(), filters,
          mode == FilterExportChoice.ACTIVE);
    } else {
      filters = this.scope['selected'].filter(function(item) {
        if (item.getEntry()) {
          var filterId = item.getEntry()['filterId'];
          if (filterId !== undefined && filterId != '*') {
            return true;
          }
          return false;
        }
        return false;
      });
    }

    FilterExportUI.exportFilters(name, filters);
  }

  /**
   * Disables export button
   *
   * @return {boolean}
   * @export
   */
  exportDisabled() {
    // off when no filters present for this layer
    var layerId = this.getLayerId_();
    var filters = this.fm.getFilters(layerId);
    if (filters && filters.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Launches the filter export process.
   *
   * @export
   */
  launchExport() {
    Metrics.getInstance().updateMetric(Filters.EXPORT, 1);
    FilterExportUI.launchFilterExport(this.save_.bind(this));
  }

  /**
   * Launches the filter import process.
   *
   * @export
   */
  import() {
    launchQueryImport({
      'layerId': this.getLayerId_()
    });
  }

  /**
   * Opens the area import menu.
   *
   * @export
   */
  openImportMenu() {
    var target = this.element.find('.js-import-group');
    var menu = areaImport.getMenu();
    if (menu && target && target.length) {
      menu.open(undefined, {
        my: 'left top+4',
        at: 'left bottom',
        of: target
      });
    }
  }

  /**
   * Sort layers
   *
   * @param {Object} a
   * @param {Object} b
   * @return {number} per compare functions
   */
  static sortLayers(a, b) {
    return caseInsensitiveCompare(a['label'], b['label']);
  }

  /**
   * @return {!Object<string, string|boolean>}
   * @protected
   */
  static getDefaultEntry() {
    return {
      'layerId': '*',
      'areaId': '*',
      'filterId': '*',
      'includeArea': true,
      'filterGroup': true
    };
  }

  /**
   * @param {!ComboNode} node
   * @param {!Array<!Object<string, string|boolean>>} entries
   * @param {Object<string, string|boolean>=} opt_entry
   * @param {boolean=} opt_advanced
   * @protected
   */
  static applyEntries(node, entries, opt_entry, opt_advanced) {
    if (node) {
      var entry = opt_entry ? Object.assign({}, opt_entry) : Controller.getDefaultEntry();
      var item = node.getEntry();
      if (item) {
        for (var key in item) {
          entry[key] = item[key];
        }

        // This fugly block applies includes/excludes and AND/OR filter groups
        var layerId = /** @type {string} */ (entry['layerId']);
        var areaId = /** @type {string} */ (entry['areaId']);
        var filterId = /** @type {string} */ (entry['filterId']);

        var includes = 0;
        var groups = 0;
        var includesTotal = 0;
        var groupsTotal = 0;

        for (var j = 0, m = entries.length; j < m; j++) {
          var e = entries[j];

          if ((!layerId || layerId === e['layerId'] || '*' === layerId) &&
              (!areaId || areaId === e['areaId'] || '*' === areaId) &&
              (!filterId || filterId === e['filterId'] || '*' === filterId)) {
            if (areaId && areaId !== '*') {
              includesTotal++;
              includes += e['includeArea'] ? 1 : 0;
            }

            if (filterId && filterId !== '*') {
              groupsTotal++;
              groups += e['filterGroup'] ? 1 : 0;
            }
          }
        }

        if (includesTotal) {
          includes = includes / includesTotal;

          if (item['areaId']) {
            item['includeArea'] = includes > 0.5;
          }
        }

        if (groupsTotal) {
          groups = groups / groupsTotal;

          if (item['filterId']) {
            item['filterGroup'] = groups > 0.5;
          }
        }
        // end fugly block
      }

      var children = /** @type {!Array<!ComboNode>} */ (node.getChildren());
      if (!children || !children.length) {
        var things = ['layerId', 'areaId', 'filterId'];
        var result = entries.filter(function(e) {
          if ('negate' in e || 'disabled' in e) {
            return false;
          }

          for (var i = 0, n = things.length; i < n; i++) {
            var thing = things[i];

            if ((opt_advanced || entry[thing] !== '*') && e[thing] !== entry[thing]) {
              return false;
            }
          }

          return true;
        });

        node.setState(result && result.length ? TriState.ON : TriState.OFF);
      } else {
        for (var i = 0, n = children.length; i < n; i++) {
          Controller.applyEntries(children[i], entries, entry, opt_advanced);
        }
      }
    }
  }

  /**
   * Get filters out of the tree
   *
   * @param {Array} arr The array of items
   * @param {Array} result The resulting flat array
   * @param {boolean} activeOnly get only the active filters
   * @private
   */
  static flatten_(arr, result, activeOnly) {
    if (arr) {
      for (var i = 0, n = arr.length; i < n; i++) {
        var item = /** @type {ComboNode} */ (arr[i]);

        if ((activeOnly && item.getState() == 'on' || !activeOnly) &&
            item.getEntry()) {
          var filterId = item.getEntry()['filterId'];
          if (filterId !== undefined && filterId != '*') {
            result.push(item);
          }
        }

        if (item.getChildren()) {
          Controller.flatten_(item.getChildren(), result, activeOnly);
        }
      }
    }
  }
}


/**
 * @type {Array<!string>}
 * @const
 * @private
 */
Controller.ORDERS_ = [
  // 'Area - Filter - Layer',
  'Area - Layer - Filter',
  //  'Filter - Area - Layer',
  //  'Filter - Layer - Area',
  'Layer - Area - Filter',
  'Layer - Filter - Area'
];
