goog.declareModuleId('os.im.action.filter');

import {findIndex} from 'ol/src/array.js';

import CommandProcessor from '../../../command/commandprocessor.js';
import SequenceCommand from '../../../command/sequencecommand.js';
import FilterActionAdd from '../../../im/action/cmd/filteractionaddcmd.js';
import FilterActionRemove from '../../../im/action/cmd/filteractionremovecmd.js';
import {getImportActionManager} from '../../../im/action/importaction.js';
import TagName from '../../../im/action/tagname.js';
import {getFilterManager} from '../../../query/queryinstance.js';
import * as xml from '../../../xml.js';
import * as filter from '../../filter/filter.js';
import ExportTypeHint from './exporttypehint.js';
import FilterActionNode from './filteractionnode.js';


const {default: ICommand} = goog.requireType('os.command.ICommand');
const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Export the provided filter action entries to XML elements.
 *
 * @param {!Array<!FilterActionEntry>} entries The entries to export.
 * @param {boolean=} opt_exactType If true, use the type from the entry. If false, use the filterable key.
 * @return {!Array<!Element>} The entry XML elements.
 */
export const exportEntries = function(entries, opt_exactType) {
  var iam = getImportActionManager();
  var result = [];

  /**
   * Parses entries out of the passed in entry. Recurses if it has children.
   *
   * @param {FilterActionEntry} entry The entry.
   */
  var parseEntries = function(entry) {
    var parsedFilter = entry.getFilterNode();
    if (parsedFilter) {
      var type;
      var typeHint;
      if (!opt_exactType) {
        // get the filterable key so the action can be applied to any layer matching the key
        var filterable = filter.getFilterableByType(entry.getType());
        if (filterable) {
          type = filterable.getFilterKey();
          typeHint = ExportTypeHint.FILTERABLE;
        }
      }

      if (!type) {
        // if no type set yet, use the entry's type which will lock the entry to a specific layer id
        type = entry.getType();
        typeHint = ExportTypeHint.EXACT;
      }

      var children = entry.getChildren() || [];
      var childIds = children.map(function(child) {
        return child.getId();
      });

      var entryEl = xml.createElement(iam.xmlEntry, undefined, undefined, {
        'id': entry.getId(),
        'active': entry.isEnabled() ? 'true' : 'false',
        'title': entry.getTitle(),
        'description': entry.getDescription() || '',
        'type': type,
        'typeHint': typeHint,
        'tags': entry.getTags() || '',
        'children': childIds.join(', ')
      });

      var filterEl = xml.appendElement('filter', entryEl);

      xml.clone(parsedFilter, filterEl, 'ogc', 'http://www.opengis.net/ogc');

      var actionsEl = xml.appendElement(TagName.ACTIONS, entryEl);
      entry.actions.forEach(function(action) {
        actionsEl.appendChild(action.toXml());
      });

      result.push(entryEl);

      if (children.length > 0) {
        children.forEach(parseEntries);
      }
    }
  };

  entries.forEach(parseEntries);

  return result;
};

/**
 * Create command to copy an entry.
 *
 * @param {!FilterActionEntry} entry The import action entry.
 * @param {number=} opt_parentIndex Optional parent index to add the entry to.
 * @return {ICommand} The copy entry command.
 */
export const copyEntryCmd = function(entry, opt_parentIndex) {
  /**
   * Sets up the new titles and IDs on copies recursively.
   *
   * @param {FilterActionEntry} e The filter action to set up.
   */
  var setupCopy = function(e) {
    var oldTitle = e.getTitle();
    e.setId(goog.string.getRandomString());
    e.setTitle(oldTitle + ' Copy');

    var children = e.getChildren();
    if (children) {
      children.forEach(setupCopy);
    }
  };

  // only clone the root, then update any children
  var copy = /** @type {!FilterActionEntry} */ (entry.clone());
  setupCopy(copy);

  var parentId = entry.getParent() ? entry.getParent().getId() : undefined;

  var iam = getImportActionManager();
  var cmd = new FilterActionAdd(copy, opt_parentIndex, parentId);
  cmd.title = 'Copy ' + iam.entryTitle + ' "' + entry.getTitle() + '"';

  return cmd;
};

/**
 * Get the initial file name to use for export.
 *
 * @return {string} The file name.
 */
export const getExportName = function() {
  return getImportActionManager().entryTitle + 's';
};

/**
 * Get the list of filter columns.
 *
 * @param {string=} opt_entryType The filter action entry type.
 * @return {!Array} The columns.
 */
export const getColumns = function(opt_entryType) {
  var columns;

  if (opt_entryType) {
    var filterable = getFilterManager().getFilterable(opt_entryType);
    if (filterable) {
      columns = filterable.getFilterColumns();
    }
  }

  return columns || [];
};

/**
 * Callback for filter action entry create/edit.
 *
 * @param {FilterActionEntry|undefined} original The orignial filter entry, for edits.
 * @param {FilterActionEntry} entry The edited filter entry.
 */
export const onEditComplete = function(original, entry) {
  // don't do anything if there was no change
  if (entry && (!original || entry.compare(original) !== 0)) {
    var cmds = [];
    var iam = getImportActionManager();
    var entryTitle = entry.getTitle();
    var insertIndex;
    var parentId;
    var searchArray;

    if (original) {
      var parent = original.getParent();
      if (parent) {
        parentId = parent.getId();
        searchArray = parent.getChildren();
      } else {
        searchArray = iam.getActionEntries(entry.getType());
      }

      insertIndex = searchArray.findIndex(function(entry) {
        return entry == original;
      });

      entryTitle = original.getTitle();
      cmds.push(new FilterActionRemove(original, insertIndex, parentId));
    }

    cmds.push(new FilterActionAdd(entry, insertIndex, parentId));

    if (cmds.length > 1) {
      var cmd = new SequenceCommand();
      cmd.setCommands(cmds);

      var appEntryTitle = iam.entryTitle;
      cmd.title = 'Update ' + appEntryTitle + ' "' + entryTitle + '"';

      CommandProcessor.getInstance().addCommand(cmd);
    } else {
      CommandProcessor.getInstance().addCommand(cmds[0]);
    }
  }
};

/**
 * Create command to remove an entry.
 *
 * @param {!FilterActionEntry} entry The import action entry to remove.
 * @return {ICommand} The remove entry command.
 */
export const removeEntryCmd = function(entry) {
  var iam = getImportActionManager();
  var entries = iam.getActionEntries(entry.getType());
  var parent = entry.getParent();
  var parentId = undefined;

  if (parent) {
    parentId = parent.getId();
    entries = parent.getChildren();
  }

  var index = findIndex(entries, function(arrEntry) {
    return arrEntry == entry;
  });

  if (index < 0) {
    index = undefined;
  }

  return new FilterActionRemove(entry, index, parentId);
};

/**
 * Recursive mapping function for pulling all of the feature actions out of a tree.
 *
 * @param {Array<FilterActionNode>} targetArr The target array.
 * @param {ITreeNode} node The current node.
 */
export const isFilterActionNode = function(targetArr, node) {
  if (node instanceof FilterActionNode) {
    goog.array.insert(targetArr, node);
  } else if (node.getChildren()) {
    node.getChildren().forEach(isFilterActionNode.bind(undefined, targetArr));
  }
};
