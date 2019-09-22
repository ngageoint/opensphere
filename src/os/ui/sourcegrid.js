goog.provide('os.ui.SourceGridCtrl');
goog.provide('os.ui.sourceGridDirective');

goog.require('goog.async.Delay');
goog.require('goog.events.EventType');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('os.color');
goog.require('os.config.Settings');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.source.PropertyChange');
goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickGridCtrl');
goog.require('os.ui.slick.column');
goog.require('os.ui.slick.formatter');
goog.require('os.ui.slick.slickGridDirective');


/**
 * The `sourcegrid` directive, for displaying a tabular list of features from a vector source.
 *
 * @return {angular.Directive}
 */
os.ui.sourceGridDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'contextMenu': '&',
      'source': '=',
      'selectedOnly': '=?',
      'rowHeight': '=?'
    },
    template: '<div class="js-source-grid slick-grid"></div>',
    controller: os.ui.SourceGridCtrl,
    controllerAs: 'grid'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('sourcegrid', [os.ui.sourceGridDirective]);



/**
 * Controller class for the `sourcegrid` directive.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$compile} $compile The Angular $compile service.
 * @extends {os.ui.slick.SlickGridCtrl}
 * @constructor
 * @ngInject
 */
os.ui.SourceGridCtrl = function($scope, $element, $compile) {
  // always allow double-click copying in source grids
  $scope['dblClickEnabled'] = true;
  // enable the column context menu
  $scope['columnMenuEnabled'] = true;

  os.ui.SourceGridCtrl.base(this, 'constructor', $scope, $element, $compile);
  this.copyLimitMsg = os.ui.SourceGridCtrl.COPY_LIMIT_MSG;
  this.useExtractorInSort = false;

  /**
   * The vector source.
   * @type {os.source.Vector}
   * @protected
   */
  this.source = null;

  /**
   * Delay to debounce selection changes.
   * @type {goog.async.Delay}
   * @private
   */
  this.selectDelay_ = new goog.async.Delay(this.onSelectChangeDelay_, 25, this);

  /**
   * Delay to debounce data updates.
   * @type {goog.async.Delay}
   * @private
   */
  this.updateDelay_ = new goog.async.Delay(this.onUpdateDelay_, 200, this);

  /**
   * Column to display the current feature color.
   * @type {os.data.ColumnDefinition}
   * @private
   */
  this.colorColumn_ = os.ui.slick.column.color();

  $scope['columns'] = [];
  $scope['options'] = {
    'dataItemColumnValueExtractor': this.getValueFromFeature_.bind(this),
    'multiColumnSort': true,
    'multiSelect': true,
    'defaultFormatter': os.ui.slick.formatter.urlNewTabFormatter,
    'enableAsyncPostRender': true
  };

  if ($scope['rowHeight']) {
    $scope['options']['rowHeight'] = $scope['rowHeight'];
    $scope.$watch('rowHeight', function() {
      $scope['options']['rowHeight'] = $scope['rowHeight'];
      this.onOptionsChange($scope['options'], $scope['options']);
      this.onColumnsChange();
    }.bind(this));
  }

  var editGroup = this.columnMenu ? this.columnMenu.getRoot().find(os.ui.slick.ColumnMenuGroup.EDIT) : undefined;
  if (editGroup) {
    var hasFeatures = function() {
      return !!this.source && this.source.getFeatureCount() > 0;
    };

    var hasHiddenColumns = function() {
      var columns = this.getColumnsInternal();
      for (var i = 0; i < columns.length; i++) {
        if (!columns[i]['visible']) {
          return true;
        }
      }

      return false;
    };

    editGroup.addChild({
      label: 'Hide Empty Columns',
      eventType: os.ui.slick.ColumnEventType.HIDE_EMPTY,
      tooltip: 'Hides columns that are unpopulated for all loaded data',
      icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
      beforeRender: hasFeatures.bind(this),
      sort: 1
    });

    editGroup.addChild({
      label: 'Show All Columns',
      eventType: os.ui.slick.ColumnEventType.SHOW_ALL,
      tooltip: 'Shows all columns on the source',
      icons: ['<i class="fa fa-fw fa-eye"></i>'],
      beforeRender: hasHiddenColumns.bind(this),
      sort: 1
    });

    this.columnMenu.listen(os.ui.slick.ColumnEventType.HIDE_EMPTY, this.onHideEmptyColumns, false, this);
    this.columnMenu.listen(os.ui.slick.ColumnEventType.SHOW_ALL, this.onShowAllColumns, false, this);
  }

  this.destroyers.push($scope.$watch('selectedOnly', this.onSelectedOnlyChange_.bind(this)));
  this.destroyers.push($scope.$watch('source', this.onSourceSwitch.bind(this)));

  os.settings.listen(os.time.OFFSET_KEY, this.onOffsetChange_, false, this);
};
goog.inherits(os.ui.SourceGridCtrl, os.ui.slick.SlickGridCtrl);


/**
 * Message to display when the user tries copying too much data to the clipboard.
 * @type {string}
 * @const
 */
os.ui.SourceGridCtrl.COPY_LIMIT_MSG = 'Data exceeds the maximum copy limit. Please reduce the selected/displayed ' +
    'data and try again, or export the data to a file.';


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.disposeInternal = function() {
  this.onSourceSwitch(null, this.scope['source']);

  goog.dispose(this.updateDelay_);
  this.updateDelay_ = null;
  goog.dispose(this.selectDelay_);
  this.selectDelay_ = null;

  os.settings.unlisten(os.time.OFFSET_KEY, this.onOffsetChange_, false, this);

  os.ui.SourceGridCtrl.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ui.SourceGridCtrl.prototype.multiColumnSort = function(cols, a, b) {
  return os.ui.SourceGridCtrl.base(this, 'multiColumnSort', cols, a.values_, b.values_);
};


/**
 * Start the data update delay if it isn't already started.
 *
 * @param {boolean=} opt_force If the delay restart should be forced.
 * @private
 */
os.ui.SourceGridCtrl.prototype.queueUpdate_ = function(opt_force) {
  if (this.updateDelay_ && (!this.updateDelay_.isActive() || opt_force)) {
    this.updateDelay_.start();
  }
};


/**
 * Finds empty columns on the current source and hides them from view.
 *
 * @param {os.ui.menu.MenuEvent<os.ui.slick.ColumnContext>} event The column menu event.
 * @protected
 */
os.ui.SourceGridCtrl.prototype.onHideEmptyColumns = function(event) {
  if (this.source) {
    var empty = this.source.getEmptyColumns();
    var count = this.setColumnsVisible(empty, false);
    if (count > 0) {
      this.onUserColumnsChange();
      os.alertManager.sendAlert('Hid ' + count + ' empty column' + (count > 1 ? 's' : '') + '.',
          os.alert.AlertEventSeverity.SUCCESS);
    } else {
      os.alertManager.sendAlert('No empty/visible columns found.',
          os.alert.AlertEventSeverity.INFO);
    }
  }
};


/**
 * Finds empty columns on the current source and adds them to the view.
 *
 * @param {os.ui.menu.MenuEvent<os.ui.slick.ColumnContext>} event The column menu event.
 * @protected
 */
os.ui.SourceGridCtrl.prototype.onShowAllColumns = function(event) {
  if (this.source) {
    var columns = this.getColumnsInternal();
    var count = this.setColumnsVisible(columns, true);
    if (count > 0) {
      this.onUserColumnsChange();
      os.alertManager.sendAlert('Added ' + count + ' hidden column' + (count > 1 ? 's' : '') + '.',
          os.alert.AlertEventSeverity.SUCCESS);
    } else {
      os.alertManager.sendAlert('No hidden columns found.', os.alert.AlertEventSeverity.INFO);
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.onUserColumnsChange = function(opt_changed) {
  if (this.source) {
    // flag modified columns
    if (opt_changed) {
      opt_changed.forEach(function(c) {
        c['userModified'] = true;
      });
    }

    this.source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLUMNS,
        this.source.getColumnsArray()));
  }
};


/**
 * Set the visible flag on columns.
 *
 * @param {!Array<!os.data.ColumnDefinition>} columns The columns.
 * @param {boolean} visible If the columns should be visible.
 * @return {number} The number of columns with changed visibility.
 * @protected
 */
os.ui.SourceGridCtrl.prototype.setColumnsVisible = function(columns, visible) {
  return columns.reduce(function(count, column) {
    if (column['visible'] != visible) {
      column['visible'] = visible;
      count++;
    }

    return count;
  }, 0);
};


/**
 * Handle changes to time offset.
 *
 * @param {os.events.PropertyChangeEvent} e The change event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onOffsetChange_ = function(e) {
  this.invalidateRows();
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.onColumnReset = function(event) {
  var context = event.getContext();
  if (context && context.grid === this) {
    var columns = this.getColumnsInternal();
    columns.forEach(function(column) {
      column['visible'] = true;
      column['width'] = 0;
      column['userModified'] = false;
    });

    columns.sort(os.ui.slick.column.autoSizeAndSortColumns);

    this.onUserColumnsChange();
  }
};


/**
 * Handle changes to the selected only flag.
 *
 * @param {boolean=} opt_new The new value.
 * @param {boolean=} opt_old The old value.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onSelectedOnlyChange_ = function(opt_new, opt_old) {
  if (opt_new !== opt_old) {
    this.queueUpdate_(true);
  }
};


/**
 * Handle changes to the source.
 *
 * @param {os.source.Vector} newVal The new source.
 * @param {os.source.Vector} oldVal The old source.
 */
os.ui.SourceGridCtrl.prototype.onSourceSwitch = function(newVal, oldVal) {
  if (oldVal) {
    ol.events.unlisten(oldVal, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    ol.events.unlisten(oldVal, ol.source.VectorEventType.ADDFEATURE, this.onFeaturesAdded_, this);
    ol.events.unlisten(oldVal, ol.source.VectorEventType.REMOVEFEATURE, this.onFeaturesRemoved_, this);
  }

  this.source = newVal;

  if (newVal) {
    // switching grid data will clear the selection in onGridSelectedChange, so flag that we're in an event
    this.inEvent = true;
    this.updateFeatures();
    this.inEvent = false;

    // set the selection before updating columns, or the selection will be cleared when we update selected rows
    this.onSelectedChange(this.source.getSelectedItems());
    this.onColumnsChange();

    ol.events.listen(newVal, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    ol.events.listen(newVal, ol.source.VectorEventType.ADDFEATURE, this.onFeaturesAdded_, this);
    ol.events.listen(newVal, ol.source.VectorEventType.REMOVEFEATURE, this.onFeaturesRemoved_, this);
  } else {
    this.scope.data = [];
    this.onColumnsChange();
  }
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.getContextArgs = function(opt_event) {
  return this.source;
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.copyRows = function(opt_mapFn) {
  var columns = this.getColumnsInternal().filter(function(column) {
    return !!column && column['visible'];
  });

  var mapFn = function(feature) {
    return columns.map(function(column) {
      return goog.string.makeSafe(feature.get(column['field']));
    }).join(',');
  };

  os.ui.SourceGridCtrl.base(this, 'copyRows', mapFn);
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.getColumns = function() {
  var columns = os.ui.SourceGridCtrl.superClass_.getColumns.call(this);
  if (columns.length > 0) {
    columns.unshift(this.colorColumn_);
  }

  return columns;
};


/**
 * Get column definitions from the vector source. This gets the *original* array, so care must be taken in modifying
 * the result.
 *
 * @return {!Array.<os.data.ColumnDefinition>} The column definitions.
 * @override
 * @protected
 */
os.ui.SourceGridCtrl.prototype.getColumnsInternal = function() {
  return this.source ? this.source.getColumnsArray() : [];
};


/**
 * Gets a value from a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {(os.data.ColumnDefinition|string)} col The column.
 * @return {*} The value.
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ui.SourceGridCtrl.prototype.getValueFromFeature_ = function(feature, col) {
  if (col['id'] == os.ui.slick.column.COLOR_ID) {
    var color = /** @type {Array<number>|string|undefined} */ (os.feature.getColor(feature, this.source));
    if (color) {
      // disregard opacity - only interested in displaying the color
      color = os.color.toHexString(color);
    }

    return color || '#ffffff';
  }

  return feature.values_[col['field'] || col];
};


/**
 * Handle features added to the source.
 *
 * @param {ol.source.Vector.Event} e The vector event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onFeaturesAdded_ = function(e) {
  // rate limit update because these events are received per-feature
  this.queueUpdate_();
};


/**
 * Handle features removed from the source.
 *
 * @param {ol.source.Vector.Event} e The vector event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onFeaturesRemoved_ = function(e) {
  // rate limit update because these events are received per-feature
  this.queueUpdate_();
};


/**
 * Handle property changes on the source.
 *
 * @param {os.events.PropertyChangeEvent} e The change event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onSourceChange_ = function(e) {
  var p = e.getProperty();

  if (p === os.source.PropertyChange.COLUMNS) {
    this.onColumnsChange();
  } else if (p === os.source.PropertyChange.COLUMN_ADDED) {
    // add the new column and scroll to it
    this.onColumnsChange();
    this.scrollToCell(this.getSelectedRows()[0] || 0, Infinity);
  } else if (p === os.source.PropertyChange.FEATURES) {
    this.updateFeatures();
  } else if (p === os.events.SelectionType.CHANGED) {
    if (this.scope && this.scope['selectedOnly']) {
      // showing selected items only, so trigger a full update
      this.queueUpdate_(true);
    } else {
      // update the selection only
      this.onSelectedChange(this.source.getSelectedItems());
    }
  } else if (p === os.events.SelectionType.ADDED || p === os.events.SelectionType.REMOVED) {
    if (this.scope && this.scope['selectedOnly']) {
      // showing selected items only, so trigger a full update
      this.queueUpdate_(true);
    } else {
      // reset timer for onSelectedChange
      this.selectDelay_.start();
    }
  } else if (p === os.source.PropertyChange.HIGHLIGHTED_ITEMS) {
    if (!this.inEvent) {
      this.inEvent = true;

      this.element.find('.hovered').removeClass('hovered');
      var items = this.source.getHighlightedItems();
      var item = items && items.length == 1 ? items[0] : null;
      if (item) {
        var row = this.mapItemsToRows(item, 0, null);
        if (row !== undefined) {
          this.grid.scrollRowIntoView(row, 0);

          var rowNode = this.grid.getRowNode(row);
          if (rowNode) {
            $(rowNode).addClass('hovered');
          }
        }
      }

      this.inEvent = false;
    }
  } else if (p === os.source.PropertyChange.FEATURE_VISIBILITY || p === os.source.PropertyChange.TIME_ENABLED ||
      p == os.source.PropertyChange.TIME_FILTER) {
    // start the delay on each visibility event so the grid isn't updated while the user is dragging the timeline
    this.queueUpdate_(true);
  } else if (p === os.source.PropertyChange.STYLE || p === os.source.PropertyChange.COLOR ||
      p === os.source.PropertyChange.REPLACE_STYLE || p === os.source.PropertyChange.DATA) {
    // refresh the rows when the style/color changes to update the feature color icons
    this.invalidateRows();
  }
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.onGridSelectedChange = function(e, args) {
  if (!this.inEvent && this.source) {
    this.inEvent = true;

    var rows = /** @type {?Array.<number>} */ (args['rows']);
    if (rows) {
      // only update the source if the user interacted with the grid
      if (this.inInteraction) {
        var result = rows.map(this.mapRowsToItems, this);
        var equal = goog.array.equals(result, this.source.getSelectedItems(), function(a, b) {
          return a.id == b.id;
        });

        if (!equal) {
          // only update the selection if it changed
          this.source.setSelectedItems(result);
        }
      }

      this.apply();
    }

    this.inEvent = false;
  }
};


/**
 * Update selected items.
 *
 * @param {goog.events.Event=} opt_e The event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onSelectChangeDelay_ = function(opt_e) {
  if (this.source) {
    this.onSelectedChange(this.source.getSelectedItems());
  }
};


/**
 * Update data displayed in the grid.
 *
 * @param {goog.events.Event=} opt_e The event.
 * @private
 */
os.ui.SourceGridCtrl.prototype.onUpdateDelay_ = function(opt_e) {
  this.updateFeatures();
};


/**
 * Convenience function to update displayed features and the grid selection.
 *
 * @protected
 */
os.ui.SourceGridCtrl.prototype.updateFeatures = function() {
  if (this.source) {
    if (this.scope && this.scope['selectedOnly']) {
      var features = this.source.getSelectedItems();
      this.updateData(features);
      this.onSelectedChange(features);
    } else {
      this.updateData(this.source.getFilteredFeatures());
      this.onSelectedChange(this.source.getSelectedItems());
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.onMouseEnter = function(e, args) {
  if (!this.inEvent) {
    this.inEvent = true;
    var cell = this.grid.getCellFromEvent(e);
    var row = /** @type {?Array.<number>} */ (cell['row']);
    var item = /** @type {?ol.Feature} */ (this.grid.getDataItem(row));
    this.source.handleFeatureHover(item);
    this.inEvent = false;
  }
};


/**
 * @inheritDoc
 */
os.ui.SourceGridCtrl.prototype.onMouseLeave = function(e, args) {
  if (!this.inEvent) {
    this.inEvent = true;
    this.source.handleFeatureHover(null);
    this.inEvent = false;
  }
};
