goog.declareModuleId('os.ui.SourceGridUI');

import {listen, unlistenByKey} from 'ol/src/events.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {toHexString} from '../color.js';
import Settings from '../config/settings.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import SelectionType from '../events/selectiontype.js';
import {getColor} from '../feature/feature.js';
import PropertyChange from '../source/propertychange.js';
import {OFFSET_KEY} from '../time/time.js';
import Module from './module.js';
import {COLOR_ID, autoSizeAndSortColumns, color as colorColumn} from './slick/column.js';
import ColumnEventType from './slick/columneventtype.js';
import ColumnMenuGroup from './slick/columnmenugroup.js';
import * as formatter from './slick/formatter.js';
import {Controller as SlickGridCtrl} from './slick/slickgrid.js';

const {equals} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const {makeSafe} = goog.require('goog.string');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: VectorSource} = goog.requireType('os.source.Vector');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: ColumnContext} = goog.requireType('os.ui.slick.ColumnContext');


/**
 * The `sourcegrid` directive, for displaying a tabular list of features from a vector source.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'contextMenu': '&',
    'source': '=',
    'selectedOnly': '=?',
    'rowHeight': '=?'
  },
  template: '<div class="js-source-grid slick-grid"></div>',
  controller: Controller,
  controllerAs: 'grid'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'sourcegrid';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller class for the `sourcegrid` directive.
 * @unrestricted
 */
export class Controller extends SlickGridCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$compile} $compile The Angular $compile service.
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    // always allow double-click copying in source grids
    $scope['dblClickEnabled'] = true;
    // enable the column context menu
    $scope['columnMenuEnabled'] = true;

    super($scope, $element, $compile);
    this.copyLimitMsg = Controller.COPY_LIMIT_MSG;
    this.useExtractorInSort = false;

    this.propertyChangeKey = null;
    this.addFeatureKey = null;
    this.removeFeatureKey = null;

    /**
     * The vector source.
     * @type {VectorSource}
     * @protected
     */
    this.source = null;

    /**
     * Delay to debounce selection changes.
     * @type {Delay}
     * @private
     */
    this.selectDelay_ = new Delay(this.onSelectChangeDelay_, 25, this);

    /**
     * Delay to debounce data updates.
     * @type {Delay}
     * @private
     */
    this.updateDelay_ = new Delay(this.onUpdateDelay_, 200, this);

    /**
     * Column to display the current feature color.
     * @type {ColumnDefinition}
     * @private
     */
    this.colorColumn_ = colorColumn();

    $scope['columns'] = [];
    $scope['options'] = {
      'dataItemColumnValueExtractor': this.getValueFromFeature.bind(this),
      'multiColumnSort': true,
      'multiSelect': true,
      'defaultFormatter': formatter.urlNewTabFormatter,
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

    var editGroup = this.columnMenu ? this.columnMenu.getRoot().find(ColumnMenuGroup.EDIT) : undefined;
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
        eventType: ColumnEventType.HIDE_EMPTY,
        tooltip: 'Hides columns that are unpopulated for all loaded data',
        icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
        beforeRender: hasFeatures.bind(this),
        sort: 1
      });

      editGroup.addChild({
        label: 'Show All Columns',
        eventType: ColumnEventType.SHOW_ALL,
        tooltip: 'Shows all columns on the source',
        icons: ['<i class="fa fa-fw fa-eye"></i>'],
        beforeRender: hasHiddenColumns.bind(this),
        sort: 1
      });

      this.columnMenu.listen(ColumnEventType.HIDE_EMPTY, this.onHideEmptyColumns, false, this);
      this.columnMenu.listen(ColumnEventType.SHOW_ALL, this.onShowAllColumns, false, this);
    }

    this.destroyers.push($scope.$watch('selectedOnly', this.onSelectedOnlyChange_.bind(this)));
    this.destroyers.push($scope.$watch('source', this.onSourceSwitch.bind(this)));

    Settings.getInstance().listen(OFFSET_KEY, this.onOffsetChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.onSourceSwitch(null, this.scope['source']);

    dispose(this.updateDelay_);
    this.updateDelay_ = null;
    dispose(this.selectDelay_);
    this.selectDelay_ = null;

    Settings.getInstance().unlisten(OFFSET_KEY, this.onOffsetChange_, false, this);

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  multiColumnSort(cols, a, b) {
    return super.multiColumnSort(cols, a.values_, b.values_);
  }

  /**
   * Start the data update delay if it isn't already started.
   *
   * @param {boolean=} opt_force If the delay restart should be forced.
   * @private
   */
  queueUpdate_(opt_force) {
    if (this.updateDelay_ && (!this.updateDelay_.isActive() || opt_force)) {
      this.updateDelay_.start();
    }
  }

  /**
   * Finds empty columns on the current source and hides them from view.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onHideEmptyColumns(event) {
    if (this.source) {
      var empty = this.source.getEmptyColumns();
      var count = this.setColumnsVisible(empty, false);
      if (count > 0) {
        this.onUserColumnsChange();
        AlertManager.getInstance().sendAlert('Hid ' + count + ' empty column' + (count > 1 ? 's' : '') + '.',
            AlertEventSeverity.SUCCESS);
      } else {
        AlertManager.getInstance().sendAlert('No empty/visible columns found.',
            AlertEventSeverity.INFO);
      }
    }
  }

  /**
   * Finds empty columns on the current source and adds them to the view.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onShowAllColumns(event) {
    if (this.source) {
      var columns = this.getColumnsInternal();
      var count = this.setColumnsVisible(columns, true);
      if (count > 0) {
        this.onUserColumnsChange();
        AlertManager.getInstance().sendAlert('Added ' + count + ' hidden column' + (count > 1 ? 's' : '') + '.',
            AlertEventSeverity.SUCCESS);
      } else {
        AlertManager.getInstance().sendAlert('No hidden columns found.', AlertEventSeverity.INFO);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onUserColumnsChange(opt_changed) {
    if (this.source) {
      // flag modified columns
      if (opt_changed) {
        opt_changed.forEach(function(c) {
          c['userModified'] = true;
        });
      }

      this.source.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLUMNS,
          this.source.getColumnsArray()));
    }
  }

  /**
   * Set the visible flag on columns.
   *
   * @param {!Array<!ColumnDefinition>} columns The columns.
   * @param {boolean} visible If the columns should be visible.
   * @return {number} The number of columns with changed visibility.
   * @protected
   */
  setColumnsVisible(columns, visible) {
    return columns.reduce(function(count, column) {
      if (column['visible'] != visible) {
        column['visible'] = visible;
        count++;
      }

      return count;
    }, 0);
  }

  /**
   * Handle changes to time offset.
   *
   * @param {PropertyChangeEvent} e The change event.
   * @private
   */
  onOffsetChange_(e) {
    this.invalidateRows();
  }

  /**
   * @inheritDoc
   */
  onColumnReset(event) {
    var context = event.getContext();
    if (context && context.grid === this) {
      var columns = this.getColumnsInternal();
      columns.forEach(function(column) {
        column['visible'] = true;
        column['width'] = 0;
        column['userModified'] = false;
      });

      columns.sort(autoSizeAndSortColumns);

      this.onUserColumnsChange();
    }
  }

  /**
   * Handle changes to the selected only flag.
   *
   * @param {boolean=} opt_new The new value.
   * @param {boolean=} opt_old The old value.
   * @private
   */
  onSelectedOnlyChange_(opt_new, opt_old) {
    if (opt_new !== opt_old) {
      this.queueUpdate_(true);
    }
  }

  /**
   * Handle changes to the source.
   *
   * @param {VectorSource} newVal The new source.
   * @param {VectorSource} oldVal The old source.
   */
  onSourceSwitch(newVal, oldVal) {
    if (oldVal) {
      unlistenByKey(this.propertyChangeKey);
      unlistenByKey(this.addFeatureKey);
      unlistenByKey(this.removeFeatureKey);
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

      this.propertyChangeKey = listen(newVal, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
      this.addFeatureKey = listen(newVal, VectorEventType.ADDFEATURE, this.onFeaturesAdded_, this);
      this.removeFeatureKey = listen(newVal, VectorEventType.REMOVEFEATURE, this.onFeaturesRemoved_, this);
    } else {
      this.scope.data = [];
      this.onColumnsChange();
    }
  }

  /**
   * @inheritDoc
   */
  getContextArgs(opt_event) {
    return this.source;
  }

  /**
   * @inheritDoc
   */
  copyRows(opt_mapFn) {
    var columns = this.getColumnsInternal().filter(function(column) {
      return !!column && column['visible'];
    });

    var mapFn = function(feature) {
      return columns.map(function(column) {
        return makeSafe(feature.get(column['field']));
      }).join(',');
    };

    super.copyRows(mapFn);
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    var columns = super.getColumns();
    if (columns.length > 0) {
      columns.unshift(this.colorColumn_);
    }

    return columns;
  }

  /**
   * Get column definitions from the vector source. This gets the *original* array, so care must be taken in modifying
   * the result.
   *
   * @return {!Array<ColumnDefinition>} The column definitions.
   * @override
   * @protected
   */
  getColumnsInternal() {
    return this.source ? this.source.getColumnsArray() : [];
  }

  /**
   * Gets a value from a feature.
   *
   * @param {Feature} feature The feature.
   * @param {(ColumnDefinition|string)} col The column.
   * @return {*} The value.
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  getValueFromFeature(feature, col) {
    if (col['id'] == COLOR_ID) {
      var color = /** @type {Array<number>|string|undefined} */ (getColor(feature, this.source));
      if (color) {
        // disregard opacity - only interested in displaying the color
        color = toHexString(color);
      }

      return color || '#ffffff';
    }

    return feature.values_[col['field'] || col];
  }

  /**
   * Handle features added to the source.
   *
   * @param {OLVectorSource.Event} e The vector event.
   * @private
   */
  onFeaturesAdded_(e) {
    // rate limit update because these events are received per-feature
    this.queueUpdate_();
  }

  /**
   * Handle features removed from the source.
   *
   * @param {OLVectorSource.Event} e The vector event.
   * @private
   */
  onFeaturesRemoved_(e) {
    // rate limit update because these events are received per-feature
    this.queueUpdate_();
  }

  /**
   * Handle property changes on the source.
   *
   * @param {PropertyChangeEvent} e The change event.
   * @private
   */
  onSourceChange_(e) {
    var p = e.getProperty();

    if (p === PropertyChange.COLUMNS) {
      this.onColumnsChange();
    } else if (p === PropertyChange.COLUMN_ADDED) {
      // add the new column and scroll to it
      this.onColumnsChange();
      this.scrollToCell(this.getSelectedRows()[0] || 0, Infinity);
    } else if (p === PropertyChange.FEATURES) {
      this.updateFeatures();
    } else if (p === SelectionType.CHANGED) {
      if (this.scope && this.scope['selectedOnly']) {
        // showing selected items only, so trigger a full update
        this.queueUpdate_(true);
      } else {
        // update the selection only
        this.onSelectedChange(this.source.getSelectedItems());
      }
    } else if (p === SelectionType.ADDED || p === SelectionType.REMOVED) {
      if (this.scope && this.scope['selectedOnly']) {
        // showing selected items only, so trigger a full update
        this.queueUpdate_(true);
      } else {
        // reset timer for onSelectedChange
        this.selectDelay_.start();
      }
    } else if (p === PropertyChange.HIGHLIGHTED_ITEMS) {
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
    } else if (p === PropertyChange.FEATURE_VISIBILITY || p === PropertyChange.TIME_ENABLED ||
        p == PropertyChange.TIME_FILTER) {
      // start the delay on each visibility event so the grid isn't updated while the user is dragging the timeline
      this.queueUpdate_(true);
    } else if (p === PropertyChange.STYLE || p === PropertyChange.COLOR ||
        p === PropertyChange.REPLACE_STYLE || p === PropertyChange.DATA) {
      // refresh the rows when the style/color changes to update the feature color icons
      this.invalidateRows();
    }
  }

  /**
   * @inheritDoc
   */
  onGridSelectedChange(e, args) {
    if (!this.inEvent && this.source) {
      this.inEvent = true;

      var rows = /** @type {?Array<number>} */ (args['rows']);
      if (rows) {
        // only update the source if the user interacted with the grid
        if (this.inInteraction) {
          var result = rows.map(this.mapRowsToItems, this);
          var equal = equals(result, this.source.getSelectedItems(),
              /**
               * Compare feature id's.
               * @param {Feature} a First feature.
               * @param {Feature} b Second feature.
               * @return {boolean} If the id's are the same.
               * @suppress {checkTypes} To avoid [] access on a struct.
               */
              function(a, b) {
                return a['id'] == b['id'];
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
  }

  /**
   * Update selected items.
   *
   * @param {GoogEvent=} opt_e The event.
   * @private
   */
  onSelectChangeDelay_(opt_e) {
    if (this.source) {
      this.onSelectedChange(this.source.getSelectedItems());
    }
  }

  /**
   * Update data displayed in the grid.
   *
   * @param {GoogEvent=} opt_e The event.
   * @private
   */
  onUpdateDelay_(opt_e) {
    this.updateFeatures();
  }

  /**
   * Convenience function to update displayed features and the grid selection.
   *
   * @protected
   */
  updateFeatures() {
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
  }

  /**
   * @inheritDoc
   */
  onMouseEnter(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      var cell = this.grid.getCellFromEvent(e);
      var row = /** @type {?Array<number>} */ (cell['row']);
      var item = /** @type {?Feature} */ (this.grid.getDataItem(row));
      this.source.handleFeatureHover(item);
      this.inEvent = false;
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      this.source.handleFeatureHover(null);
      this.inEvent = false;
    }
  }
}

/**
 * Message to display when the user tries copying too much data to the clipboard.
 * @type {string}
 * @override
 */
Controller.COPY_LIMIT_MSG = 'Data exceeds the maximum copy limit. Please reduce the selected/displayed ' +
    'data and try again, or export the data to a file.';
