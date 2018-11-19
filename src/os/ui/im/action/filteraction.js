goog.provide('os.im.action.filter');
goog.provide('os.im.action.filter.ExportTypeHint');

goog.require('ol.array');
goog.require('os.command.SequenceCommand');
goog.require('os.im.action');
goog.require('os.im.action.cmd.FilterActionAdd');
goog.require('os.im.action.cmd.FilterActionRemove');
goog.require('os.ui.filter');
goog.require('os.xml');


/**
 * Type hints used in exported filter actions to identify how the type should be used.
 * @enum {string}
 */
os.im.action.filter.ExportTypeHint = {
  FILTERABLE: 'filterable',
  EXACT: 'exact'
};


/**
 * Export the provided filter action entries to XML elements.
 * @param {!Array<!os.im.action.FilterActionEntry>} entries The entries to export.
 * @param {boolean=} opt_exactType If true, use the type from the entry. If false, use the filterable key.
 * @return {!Array<!Element>} The entry XML elements.
 */
os.im.action.filter.exportEntries = function(entries, opt_exactType) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var result = [];

  /**
   * Parses entries out of the passed in entry. Recurses if it has children.
   * @param {os.im.action.FilterActionEntry} entry The entry.
   */
  var parseEntries = function(entry) {
    var parsedFilter = entry.getFilterNode();
    if (parsedFilter) {
      var type;
      var typeHint;
      if (!opt_exactType) {
        // get the filterable key so the action can be applied to any layer matching the key
        var filterable = os.ui.filter.getFilterableByType(entry.getType());
        if (filterable) {
          type = filterable.getFilterKey();
          typeHint = os.im.action.filter.ExportTypeHint.FILTERABLE;
        }
      }

      if (!type) {
        // if no type set yet, use the entry's type which will lock the entry to a specific layer id
        type = entry.getType();
        typeHint = os.im.action.filter.ExportTypeHint.EXACT;
      }

      var children = entry.getChildren() || [];
      var childIds = children.map(function(child) {
        return child.getId();
      });

      var entryEl = os.xml.createElement(iam.xmlEntry, undefined, undefined, {
        'id': entry.getId(),
        'active': entry.isEnabled() ? 'true' : 'false',
        'title': entry.getTitle(),
        'description': entry.getDescription() || '',
        'type': type,
        'typeHint': typeHint,
        'tags': entry.getTags() || '',
        'children': childIds.join(', ')
      });

      var filterEl = os.xml.appendElement('filter', entryEl);

      os.xml.clone(parsedFilter, filterEl, 'ogc', 'http://www.opengis.net/ogc');

      var actionsEl = os.xml.appendElement(os.im.action.TagName.ACTIONS, entryEl);
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
 * @param {!os.im.action.FilterActionEntry} entry The import action entry.
 * @param {number=} opt_parentIndex Optional parent index to add the entry to.
 * @return {os.command.ICommand} The copy entry command.
 */
os.im.action.filter.copyEntryCmd = function(entry, opt_parentIndex) {
  /**
   * Sets up the new titles and IDs on copies recursively.
   * @param {os.im.action.FilterActionEntry} e The filter action to set up.
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
  var copy = /** @type {!os.im.action.FilterActionEntry} */ (entry.clone());
  setupCopy(copy);

  var parentId = entry.getParent() ? entry.getParent().getId() : undefined;

  var iam = os.im.action.ImportActionManager.getInstance();
  var cmd = new os.im.action.cmd.FilterActionAdd(copy, opt_parentIndex, parentId);
  cmd.title = 'Copy ' + iam.entryTitle + ' "' + entry.getTitle() + '"';

  return cmd;
};


/**
 * Get the initial file name to use for export.
 * @return {string} The file name.
 */
os.im.action.filter.getExportName = function() {
  return os.im.action.ImportActionManager.getInstance().entryTitle + 's';
};


/**
 * Get the list of filter columns.
 * @param {string=} opt_entryType The filter action entry type.
 * @return {!Array} The columns.
 */
os.im.action.filter.getColumns = function(opt_entryType) {
  var columns;

  if (opt_entryType) {
    var filterable = os.ui.filterManager.getFilterable(opt_entryType);
    if (filterable) {
      columns = filterable.getFilterColumns();
    }
  }

  return columns || [];
};


/**
 * Callback for filter action entry create/edit.
 * @param {os.im.action.FilterActionEntry|undefined} original The orignial filter entry, for edits.
 * @param {os.im.action.FilterActionEntry} entry The edited filter entry.
 */
os.im.action.filter.onEditComplete = function(original, entry) {
  // don't do anything if there was no change
  if (entry && (!original || entry.compare(original) !== 0)) {
    var cmds = [];

    var iam = os.im.action.ImportActionManager.getInstance();
    var entries = iam.getActionEntries(entry.getType());

    var entryTitle = entry.getTitle();
    var insertIndex;
    var parentId;

    if (original) {
      insertIndex = ol.array.findIndex(entries, function(entry) {
        return entry == original;
      });

      var parent = original.getParent();
      if (parent) {
        parentId = parent.getId();
      }

      entryTitle = original.getTitle();
      cmds.push(new os.im.action.cmd.FilterActionRemove(original, insertIndex, parentId));
    }

    cmds.push(new os.im.action.cmd.FilterActionAdd(entry, insertIndex, parentId));

    if (cmds.length > 1) {
      var cmd = new os.command.SequenceCommand();
      cmd.setCommands(cmds);

      var appEntryTitle = iam.entryTitle;
      cmd.title = 'Update ' + appEntryTitle + ' "' + entryTitle + '"';

      os.commandStack.addCommand(cmd);
    } else {
      os.commandStack.addCommand(cmds[0]);
    }
  }
};


/**
 * Create command to remove an entry.
 * @param {!os.im.action.FilterActionEntry} entry The import action entry to remove.
 * @return {os.command.ICommand} The remove entry command.
 */
os.im.action.filter.removeEntryCmd = function(entry) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var entries = iam.getActionEntries(entry.getType());
  var parent = entry.getParent();
  var parentId = undefined;

  if (parent) {
    parentId = parent.getId();
    entries = parent.getChildren();
  }

  var index = ol.array.findIndex(entries, function(arrEntry) {
    return arrEntry == entry;
  });

  if (index < 0) {
    index = undefined;
  }

  return new os.im.action.cmd.FilterActionRemove(entry, index, parentId);
};


/**
 * Recursive mapping function for pulling all of the feature actions out of a tree.
 * @param {Array<os.ui.im.action.FilterActionNode>} targetArr The target array.
 * @param {os.structs.ITreeNode} node The current node.
 */
os.im.action.filter.isFilterActionNode = function(targetArr, node) {
  if (node instanceof os.ui.im.action.FilterActionNode) {
    goog.array.insert(targetArr, node);
  } else if (node.getChildren()) {
    node.getChildren().forEach(os.im.action.filter.isFilterActionNode.bind(this, targetArr));
  }
};
