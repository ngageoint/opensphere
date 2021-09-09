goog.module('os.metrics.FiltersMetrics');

const {Filters} = goog.require('os.metrics.keys');
const MetricsPlugin = goog.require('os.ui.metrics.MetricsPlugin');


/**
 */
class FiltersMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Filters');
    // this.setDescription('Filters description');
    this.setTags(['TODO']);
    this.setIcon('fa fa-filter');
    this.setCollapsed(true);

    // manually build the tree
    var leaf = this.getLeafNode();

    this.addChild(leaf, {
      label: 'Group By',
      key: Filters.GROUP_BY
    });
    this.addChild(leaf, {
      label: 'Search filters',
      key: Filters.SEARCH
    });
    this.addChild(leaf, {
      label: 'Copy filter',
      key: Filters.COPY
    });
    this.addChild(leaf, {
      label: 'Edit filter',
      key: Filters.EDIT
    });
    this.addChild(leaf, {
      label: 'Remove filter',
      key: Filters.REMOVE
    });
    this.addChild(leaf, {
      label: 'Import filter',
      key: Filters.IMPORT
    });

    var advandedFilterDialogLeaf = this.addChild(leaf, {
      label: 'Advanced filter dialog'
    });

    this.addChild(advandedFilterDialogLeaf, {
      label: 'Open Advanced Filter Dialog',
      key: Filters.ADVANCED
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Select Layer',
      key: Filters.ADVANCED_SELECT_LAYER
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Add Filter',
      key: Filters.NEW
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Advanced Toggle',
      key: Filters.ADVANCED_TOGGLE
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Expand All',
      key: Filters.ADVANCED_EXPAND_ALL
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Collapse All',
      key: Filters.ADVANCED_COLLAPSE_ALL
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Reset',
      key: Filters.ADVANCED_RESET
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Area Include/Exclude Toggle',
      key: Filters.ADVANCED_AREA_INCLUDE_TOGGLE
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Area Edit',
      key: Filters.ADVANCED_AREA_EDIT
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Area Remove',
      key: Filters.ADVANCED_AREA_REMOVE
    });

    this.addChild(advandedFilterDialogLeaf, {
      label: 'Export',
      key: Filters.EXPORT
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Import',
      key: Filters.IMPORT
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Apply',
      key: Filters.ADVANCED_APPLY
    });
    this.addChild(advandedFilterDialogLeaf, {
      label: 'Close',
      key: Filters.ADVANCED_CLOSE
    });
  }
}

exports = FiltersMetrics;
