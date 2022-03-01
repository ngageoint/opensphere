goog.declareModuleId('plugin.cookbook_metrics.CookbookMetricsPlugin');

import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';
import MenuItemType from 'opensphere/src/os/ui/menu/menuitemtype.js';
import * as spatial from 'opensphere/src/os/ui/menu/spatial.js';
import MetricsManager from 'opensphere/src/os/ui/metrics/metricsmanager.js';

import CookbookMetrics from './cookbookmetrics.js';
import {ID, MYGROUP, EventType, Metrics, handleItem} from './index.js';


/**
 * Cookbook example of metrics
 */
export default class CookbookMetricsPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    const metricsManager = MetricsManager.getInstance();
    metricsManager.addMetricsPlugin(new CookbookMetrics());

    const menu = spatial.getMenu();
    if (menu) {
      const root = menu.getRoot();
      let group = root.find(MYGROUP);
      if (!group) {
        group = root.addChild({
          type: MenuItemType.GROUP,
          label: MYGROUP,
          tooltip: 'Added by cookbook metrics example'
        });
        group.addChild({
          type: MenuItemType.ITEM,
          eventType: EventType.DO_ANOTHER_THING,
          label: 'Item 1',
          metricKey: Metrics.FIRST_THING,
          handler: handleItem
        });
        group.addChild({
          type: MenuItemType.ITEM,
          eventType: EventType.DO_SOMETHING,
          label: 'Item 2',
          metricKey: Metrics.SECOND_THING,
          handler: handleItem
        });
      }
    }
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new CookbookMetricsPlugin());
