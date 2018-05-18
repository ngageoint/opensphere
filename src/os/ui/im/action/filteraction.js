goog.provide('os.im.action.filter');
goog.provide('os.im.action.filter.ExportTypeHint');

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

  entries.forEach(function(entry) {
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

      var entryEl = os.xml.createElement(iam.xmlEntry, undefined, undefined, {
        'active': entry.isEnabled() ? 'true' : 'false',
        'title': entry.getTitle(),
        'description': entry.getDescription() || '',
        'type': type,
        'typeHint': typeHint
      });

      var filterEl = os.xml.appendElement('filter', entryEl);

      os.xml.clone(parsedFilter, filterEl, 'ogc', 'http://www.opengis.net/ogc');

      var actionsEl = os.xml.appendElement(os.im.action.TagName.ACTIONS, entryEl);
      entry.actions.forEach(function(action) {
        actionsEl.appendChild(action.toXml());
      });

      result.push(entryEl);
    }
  });

  return result;
};


/**
 * Create command to copy an entry.
 * @param {!os.im.action.FilterActionEntry} entry The import action entry.
 * @return {os.command.ICommand} The copy entry command.
 */
os.im.action.filter.copyEntryCmd = function(entry) {
  var oldTitle = entry.getTitle();
  var copy = /** @type {!os.im.action.FilterActionEntry} */ (entry.clone());
  copy.setId(goog.string.getRandomString());
  copy.setTitle(oldTitle + ' Copy');

  var iam = os.im.action.ImportActionManager.getInstance();
  var cmd = new os.im.action.cmd.FilterActionAdd(copy);
  cmd.title = 'Copy ' + iam.entryTitle + ' "' + oldTitle + '"';

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
  if (entry) {
    var cmds = [];

    var iam = os.im.action.ImportActionManager.getInstance();
    var entries = iam.getActionEntries(entry.getType());

    var entryTitle = entry.getTitle();
    var insertIndex;
    if (original) {
      insertIndex = goog.array.findIndex(entries, function(entry) {
        return entry == original;
      });

      entryTitle = original.getTitle();
      cmds.push(new os.im.action.cmd.FilterActionRemove(original, insertIndex));
    }

    cmds.push(new os.im.action.cmd.FilterActionAdd(entry, insertIndex));

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

  var index = goog.array.findIndex(entries, function(arrEntry) {
    return arrEntry == entry;
  });

  if (index < 0) {
    index = undefined;
  }

  return new os.im.action.cmd.FilterActionRemove(entry, index);
};
