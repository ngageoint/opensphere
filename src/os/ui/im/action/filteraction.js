goog.provide('os.im.action.filter');
goog.provide('os.im.action.filter.ExportTypeHint');

goog.require('os.im.action');
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
