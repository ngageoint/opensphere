goog.module('plugin.track.TrackPlugin');
goog.module.declareLegacyNamespace();

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const track = goog.require('plugin.track');
const Metrics = goog.require('plugin.track.Metrics');
const menu = goog.require('plugin.track.menu');


/**
 * Provides the ability to create tracks that can be animated over time.
 */
class TrackPlugin extends AbstractPlugin {
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
    menu.layerSetup();
    menu.spatialSetup();

    os.ui.metricsManager.addMetricsPlugin(new Metrics());
  }
}

goog.addSingletonGetter(TrackPlugin);


exports = TrackPlugin;
