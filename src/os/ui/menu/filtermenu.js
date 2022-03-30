goog.declareModuleId('os.ui.menu.filter');

import {remove} from 'ol/src/array.js';

import EventType from '../../action/eventtype.js';
import CommandProcessor from '../../command/commandprocessor.js';
import FilterEnable from '../../command/filterenablecmd.js';
import SequenceCommand from '../../command/sequencecommand.js';
import FilterNode from '../../data/filternode.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {getFilterManager, getQueryManager} from '../../query/queryinstance.js';
import FilterEvent from '../filter/filterevent.js';
import FilterEventType from '../filter/filtereventtype.js';
import FilterRemove from '../query/cmd/filterremovecmd.js';
import QueryEntries from '../query/cmd/queryentriescmd.js';
import {ALL_ID} from '../query/query.js';
import Menu from './menu.js';
import MenuItem from './menuitem.js';
import MenuItemType from './menuitemtype.js';

const {removeDuplicates} = goog.require('goog.array');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: TreeNode} = goog.requireType('os.structs.TreeNode');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * @type {Menu<!Array<!TreeNode>>}
 */
export const MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: [{
    label: 'Show',
    eventType: EventType.ENABLE,
    tooltip: 'Shows the filter',
    icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
    sort: 0
  }, {
    label: 'Hide',
    eventType: EventType.DISABLE,
    tooltip: 'Hides the filter',
    icons: ['<i class="fa fa-fw fa-square-o"></i>'],
    sort: 10
  }, {
    label: 'Turn filter on',
    eventType: EventType.APPLY,
    tooltip: 'Apply the filter to all areas for the query',
    icons: ['<i class="fa fa-fw fa-filter"></i>'],
    sort: 20
  }, {
    label: 'Turn filter off',
    eventType: EventType.UNAPPLY,
    tooltip: 'Remove the filter from all areas for the query',
    icons: ['<i class="fa fa-fw fa-ban"></i>'],
    sort: 30
  }, {
    label: 'Remove',
    eventType: EventType.REMOVE_FILTER,
    tooltip: 'Removes the filter',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    sort: 40
  }, {
    label: 'Export Filter',
    eventType: EventType.EXPORT,
    tooltip: 'Export the filter',
    icons: ['<i class="fa fa-fw fa-download"></i>'],
    sort: 50
  }]
}));

/**
 * Sets up the dynamic portions of the menu
 */
export const setup = function() {
  var menu = MENU;

  var genVisible = genVisibility;
  var show = menu.getRoot().find(EventType.ENABLE);
  if (show) {
    show.beforeRender = genVisible(hasDisabled_);
  }

  var hide = menu.getRoot().find(EventType.DISABLE);
  if (hide) {
    hide.beforeRender = genVisible(hasEnabled_);
  }

  var apply = menu.getRoot().find(EventType.APPLY);
  if (apply) {
    apply.beforeRender = genVisible(hasUnapplied_);
  }

  var unapply = menu.getRoot().find(EventType.UNAPPLY);
  if (unapply) {
    unapply.beforeRender = genVisible(hasApplied_);
  }

  var ex = menu.getRoot().find(EventType.EXPORT);
  if (ex) {
    ex.beforeRender = genVisible(isFilter_);
  }

  var remove = menu.getRoot().find(EventType.REMOVE_FILTER);
  if (remove) {
    remove.beforeRender = genVisible(isFilter_);
  }

  menu.listen(EventType.ENABLE, onFilter_);
  menu.listen(EventType.DISABLE, onFilter_);
  menu.listen(EventType.APPLY, onFilter_);
  menu.listen(EventType.UNAPPLY, onFilter_);
  menu.listen(EventType.REMOVE_FILTER, onFilter_);
  menu.listen(EventType.EXPORT, onFilter_);
};

/**
 * Creates a function which modifies the menu item visibility before render
 *
 * @param {function(Array<!TreeNode>):boolean} func The visibility function
 * @return {function(this:MenuItem, Array<!TreeNode>)}
 */
export const genVisibility = function(func) {
  /**
   * @param {Array<!TreeNode>} nodes
   * @this {MenuItem}
   */
  var visibility = function(nodes) {
    this.visible = func(nodes);
  };

  return visibility;
};

/**
 * Disposes filter menu
 */
export const dispose = function() {
  if (MENU) {
    MENU.dispose();
  }
};

/**
 * @param {Array<!TreeNode>} nodes
 * @return {Array<!FilterEntry>}
 */
export const getFilters = function(nodes) {
  var filters = [];
  if (nodes) {
    for (var i = 0, n = nodes.length; i < n; i++) {
      var node = nodes[i];

      if (node instanceof FilterNode) {
        filters.push(/** @type {FilterNode} */ (node).getEntry());
      } else {
        filters = filters.concat(getFilters(node.getChildren()));
      }
    }

    removeDuplicates(filters);
  }

  return filters;
};

/**
 * Determin if the layer is on
 *
 * @param {string} layerId
 * @return {boolean}
 */
const layerOn_ = function(layerId) {
  return getMapContainer().getLayer(layerId) != null;
};

/**
 * @param {Array<!TreeNode>} context
 * @return {boolean}
 */
const hasEnabled_ = function(context) {
  var filters = getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (filters[i].isEnabled() && layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Array<!TreeNode>} context
 * @return {boolean}
 */
const hasDisabled_ = function(context) {
  var filters = getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (!filters[i].isEnabled() && layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Array<!TreeNode>} context
 * @return {boolean}
 */
const hasApplied_ = function(context) {
  var filters = getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (getQueryManager().hasFilter(filters[i].getId()) && layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Array<!TreeNode>} context
 * @return {boolean}
 */
const hasUnapplied_ = function(context) {
  var filters = getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (!getQueryManager().hasFilter(filters[i].getId()) &&
        filters[i].isEnabled() &&
        layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Array<!TreeNode>} context
 * @return {boolean}
 */
const isFilter_ = function(context) {
  var filters = getFilters(context);
  return (filters.length > 0);
};

/**
 * Remove all entries for these filters
 *
 * @param {Array<!FilterEntry>} filters
 * @return {QueryEntries}
 */
export const fixEntries = function(filters) {
  var allEntries = getQueryManager().getEntries(null, null, null, false);

  // Remove the entry for this filter if it exists
  filters.forEach(function(filter) {
    var entries = getQueryManager().getEntries(null, null, filter.getId(), false);
    entries.forEach(function(entry) {
      remove(allEntries, entry);
    });
  });

  return new QueryEntries(allEntries, false, undefined, true);
};

/**
 * @param {MenuEvent<Array<!TreeNode>>} event The menu event
 */
const onFilter_ = function(event) {
  var context = event.getContext();

  if (context) {
    var cmds = [];
    var title = '';
    var filters = getFilters(context);

    switch (event.type) {
      case EventType.DISABLE:
        title = 'Disable filter';
        for (var i = 0, n = filters.length; i < n; i++) {
          cmds.push(new FilterEnable(filters[i], false));
        }
        break;
      case EventType.REMOVE_FILTER:
        title = 'Remove filter';
        for (var i = 0, n = filters.length; i < n; i++) {
          cmds.push(new FilterRemove(filters[i]));
        }
        break;
      case EventType.EXPORT:
        event.preventDefault();
        event.stopPropagation();
        getFilterManager().dispatchEvent(new FilterEvent(FilterEventType.EXPORT_FILTER));
        break;
      case EventType.ENABLE:
      case EventType.APPLY:
        var entries = [];
        for (var i = 0, n = filters.length; i < n; i++) {
          var filter = filters[i];

          // If the filter is already enabled, dont re-enable (messes up undo)
          if (!filter.isEnabled()) {
            cmds.push(new FilterEnable(filter, true));
            title = 'Enable and turn on filter';
          } else {
            title = 'Turn on filter';
          }

          // The merge removes all entries for a layerid, so get those first
          entries = entries.concat(getQueryManager().getEntries(filter.getType()));

          // Wipe out old entries and set wildcards
          var entry = {
            'layerId': filter.getType(),
            'areaId': '*',
            'filterId': filter.getId(),
            'includeArea': true,
            'filterGroup': true
          };
          entries.push(entry);
        }
        removeDuplicates(entries, undefined, function(filter) {
          return JSON.stringify(filter);
        });
        cmds.push(new QueryEntries(entries, true, ALL_ID, true));
        break;
      case EventType.UNAPPLY:
        title = 'Turn off filter';
        var allEntries = getQueryManager().getEntries();
        var removeEntries = [];
        for (var i = 0, n = filters.length; i < n; i++) {
          var filter = filters[i];
          removeEntries = removeEntries.concat(getQueryManager().getEntries(null, null, filter.getId()));
        }
        removeDuplicates(removeEntries, undefined, function(filter) {
          return JSON.stringify(filter);
        });
        removeEntries.forEach(function(entry) {
          remove(allEntries, entry);
        });

        cmds.push(new QueryEntries(allEntries, false, ALL_ID, true));
        break;
      default:
        break;
    }

    if (cmds.length > 0) {
      var cmd = new SequenceCommand();
      cmd.setCommands(cmds);
      cmd.title = title + (cmds.length > 1 ? 's' : '');
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};
