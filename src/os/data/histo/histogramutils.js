goog.provide('os.data.histo');

goog.require('goog.dom');
goog.require('os.alert.Alert');
goog.require('os.data.OSDataManager');
goog.require('os.filter.FilterEntry');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.ui.IHistogramUI');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.window.confirmTextDirective');


/**
 * @enum {string}
 */
os.data.histo.HistoEventType = {
  // UI events
  REMOVE_CASCADE: 'histo:removeCascade',
  TOGGLE_CASCADE: 'histo:toggleCascade',

  // data events
  BIN_CHANGE: 'histo:binChange',
  CASCADE_CHANGE: 'histo:cascadeChange'
};


/**
 * Create a filter from an array of histogram controllers.
 * @param {!Array<!os.ui.IHistogramUI>} controllers The histogram controllers
 * @param {!Array<!os.data.ColumnDefinition>} columns The filter columns.
 * @param {boolean=} opt_allowAll If all bins should be used in absence of a cascade/selection.
 * @return {os.filter.FilterEntry}
 */
os.data.histo.createFilter = function(controllers, columns, opt_allowAll) {
  var entry = null;
  var filter = [];

  var validControllers = os.data.histo.filterValidControllers(controllers, columns, opt_allowAll);
  for (var i = 0; i < validControllers.length; i++) {
    var histoFilter = validControllers[i].createXmlFilter(opt_allowAll);
    if (histoFilter) {
      filter.push(histoFilter);
    }
  }

  if (filter.length > 0) {
    var filterStr = filter.join('');

    if (filter.length > 1) {
      // multiple filters from a cascaded histogram, so wrap them in an And condition
      filterStr = '<And>' + filterStr + '</And>';
    } else {
      // single filter, so verify it has a condition
      var doc = goog.dom.xml.loadXml(filterStr);
      var filterRoot = goog.dom.getFirstElementChild(doc);
      if (!os.ui.filter.isCondition(filterRoot)) {
        // no condition, default to Or
        filterStr = '<Or>' + filterStr + '</Or>';
      }
    }

    entry = new os.filter.FilterEntry();
    entry.setEnabled(true);
    entry.setFilter(filterStr);
  }

  return entry;
};


/**
 * Create a filter from an array of histogram controllers.
 * @param {!Array<!os.ui.IHistogramUI>} controllers The histogram controllers
 * @param {!Array<!os.data.ColumnDefinition>} columns The filter columns.
 * @param {boolean=} opt_allowAll If all bins should be used in absence of a cascade/selection.
 * @return {!Array<!os.ui.IHistogramUI>}
 */
os.data.histo.filterValidControllers = function(controllers, columns, opt_allowAll) {
  var valid = [];
  var errorMsg;
  var errorLevel;

  for (var i = 0; i < controllers.length; i++) {
    var ctrl = controllers[i];

    var column = ctrl.getColumn();
    var columnName = column && column['name'] || null;
    var columnField = column && column['field'] || null;

    var matchedSourceColumn = goog.array.find(columns, function(c) {
      return c['field'] == columnField || c['name'] == columnName;
    });

    if (!columnName || !(ctrl.hasCascadedBins() || ctrl.hasSelectedBins() || (opt_allowAll && ctrl.hasBins()))) {
      // no column selected, or no bins to include in the filter. not an error, but stop here.
      break;
    } else if (!matchedSourceColumn) {
      // column selected that isn't included in the filterable columns
      errorMsg = 'Unable to create a filter using column "' + columnName + '". The application derives some values ' +
          'for internal processing though the columns are not defined on the data source.  Filters cannot be created ' +
          'using internal columns.';
      errorLevel = os.alert.AlertEventSeverity.WARNING;
      break;
    } else if (ctrl.isDateMethod()) {
      // don't allow date filters
      errorMsg = 'Unable to create a filter using column "' + columnName + '". Filters cannot be created using the ' +
          'Date type. Time filtering is managed by the application time controls.';
      errorLevel = os.alert.AlertEventSeverity.WARNING;
      break;
    }

    valid.push(ctrl);
  }

  if (!errorMsg && !valid.length) {
    // no valid controllers, and another error message hasn't been set yet. show a generic message.
    errorMsg = 'Unable to create a filter. Filters are created from ';
    if (controllers.length > 1) {
      // multiple controllers were provided, so show the cascade message
      errorMsg += 'cascaded rows <span class="nowrap">(<i class="fa fa-arrow-right"/>)</span>, or from selected rows ' +
          'in the last Count By.';
    } else {
      // single controller message
      errorMsg += 'selected rows in the Count By.';
    }
    errorMsg += ' Unrecognized/invalid values will be omitted from filters.';
    errorLevel = os.alert.AlertEventSeverity.ERROR;
  }

  if (errorMsg) {
    os.alertManager.sendAlert(errorMsg, errorLevel);
  }

  return valid;
};
