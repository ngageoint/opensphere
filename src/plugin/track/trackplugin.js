goog.module('plugin.track.TrackPlugin');
goog.module.declareLegacyNamespace();

const menu = goog.require('plugin.track.menu');
const track = goog.require('plugin.track');
const ui = goog.require('os.ui');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const MapContainer = goog.require('os.MapContainer');
const Metrics = goog.require('plugin.track.Metrics');
const Settings = goog.require('os.config.Settings');
const TrackInteraction = goog.require('plugin.track.TrackInteraction');

const settings = Settings.getInstance();


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
    const predict = (settings.get(track.PREDICT, false) === true);

    menu.layerSetup(predict);
    menu.spatialSetup(predict);

    ui.metricsManager.addMetricsPlugin(new Metrics());

    if (predict) {
      MapContainer.getInstance().getMap().getInteractions().push(new TrackInteraction());
    }
  }
}

goog.addSingletonGetter(TrackPlugin);


exports = TrackPlugin;
