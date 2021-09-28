goog.declareModuleId('plugin.track.TrackPlugin');

import * as track from './track.js';
import TrackInteraction from './trackinteraction.js';
import * as menu from './trackmenu.js';
import Metrics from './trackmetrics.js';

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const MapContainer = goog.require('os.MapContainer');
const MetricsManager = goog.require('os.ui.metrics.MetricsManager');
const Settings = goog.require('os.config.Settings');

const settings = Settings.getInstance();

/**
 * Provides the ability to create tracks that can be animated over time.
 */
export default class TrackPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = track.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    const predict = (settings.get(track.PREDICT, false) === true);

    menu.layerSetup(predict);
    menu.spatialSetup(predict);

    MetricsManager.getInstance().addMetricsPlugin(new Metrics());

    if (predict) {
      MapContainer.getInstance().getMap().getInteractions().push(new TrackInteraction());
    }
  }
}

goog.addSingletonGetter(TrackPlugin);
