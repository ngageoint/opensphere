goog.provide('os.metrics.FiltersMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.FiltersMetrics = function() {
  os.metrics.FiltersMetrics.base(this, 'constructor');

  this.setLabel('Filters');
  // this.setDescription('Filters description');
  this.setTags(['TODO']);
  this.setIcon('fa fa-filter');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();

  this.addChild(leaf, {
    label: 'Group By',
    key: os.metrics.keys.Filters.GROUP_BY
  });
  this.addChild(leaf, {
    label: 'Search filters',
    key: os.metrics.keys.Filters.SEARCH
  });
  this.addChild(leaf, {
    label: 'Copy filter',
    key: os.metrics.keys.Filters.COPY
  });
  this.addChild(leaf, {
    label: 'Edit filter',
    key: os.metrics.keys.Filters.EDIT
  });
  this.addChild(leaf, {
    label: 'Remove filter',
    key: os.metrics.keys.Filters.REMOVE
  });
  this.addChild(leaf, {
    label: 'Import filter',
    key: os.metrics.keys.Filters.IMPORT
  });

  var advandedFilterDialogLeaf = this.addChild(leaf, {
    label: 'Advanced filter dialog'
  });

  this.addChild(advandedFilterDialogLeaf, {
    label: 'Open Advanced Filter Dialog',
    key: os.metrics.keys.Filters.ADVANCED
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Select Layer',
    key: os.metrics.keys.Filters.ADVANCED_SELECT_LAYER
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Add Filter',
    key: os.metrics.keys.Filters.NEW
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Advanced Toggle',
    key: os.metrics.keys.Filters.ADVANCED_TOGGLE
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Expand All',
    key: os.metrics.keys.Filters.ADVANCED_EXPAND_ALL
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Collapse All',
    key: os.metrics.keys.Filters.ADVANCED_COLLAPSE_ALL
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Reset',
    key: os.metrics.keys.Filters.ADVANCED_RESET
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Area Include/Exclude Toggle',
    key: os.metrics.keys.Filters.ADVANCED_AREA_INCLUDE_TOGGLE
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Area Edit',
    key: os.metrics.keys.Filters.ADVANCED_AREA_EDIT
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Area Remove',
    key: os.metrics.keys.Filters.ADVANCED_AREA_REMOVE
  });

  this.addChild(advandedFilterDialogLeaf, {
    label: 'Export',
    key: os.metrics.keys.Filters.EXPORT
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Import',
    key: os.metrics.keys.Filters.IMPORT
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Apply',
    key: os.metrics.keys.Filters.ADVANCED_APPLY
  });
  this.addChild(advandedFilterDialogLeaf, {
    label: 'Close',
    key: os.metrics.keys.Filters.ADVANCED_CLOSE
  });
};
goog.inherits(os.metrics.FiltersMetrics, os.ui.metrics.MetricsPlugin);
