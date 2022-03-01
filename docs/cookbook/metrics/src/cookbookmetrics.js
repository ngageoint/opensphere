goog.declareModuleId('plugin.cookbook_metrics.CookbookMetrics');

import MetricsPlugin from 'opensphere/src/os/ui/metrics/metricsplugin.js';
import {Metrics} from './index.js';

/**
 */
export default class CookbookMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Cookbook');
    this.setIcon('fa fa-book');
    this.setCollapsed(true);
    this.setDescription('Plugin for metrics example.');

    const leaf = this.getLeafNode();
    this.addChild(leaf, {
      label: 'First Metric Item',
      description: 'This is an item.',
      key: Metrics.FIRST_THING
    });

    this.addChild(leaf, {
      label: 'Second Metric Item',
      description: 'Does something.',
      key: Metrics.SECOND_THING
    });

    this.addChild(leaf, {
      label: 'Third Metric Item',
      description: 'Combination, programmatic.',
      key: Metrics.EXTRA_THING
    });
  }
}
