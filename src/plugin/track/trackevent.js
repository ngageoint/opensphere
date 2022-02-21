goog.declareModuleId('plugin.track.Event');

const googEventsEvent = goog.require('goog.events.Event');


/**
 * Event for the track plugin.
 */
export default class Event extends googEventsEvent {
  /**
   * Constructor.
   * @param {string} type The event type
   */
  constructor(type) {
    super(type);

    /**
     * The existing track feature.
     * @type {OlFeature|undefined}
     */
    this.track = undefined;

    /**
     * The features used to assemble the track.
     * @type {Array<!OlFeature>|undefined}
     */
    this.features = undefined;

    /**
     * The histogram bins used to create the track.
     * @type {Array<!ColorBin>|undefined}
     */
    this.bins = undefined;

    /**
     * The filters used to match track features. Must match up to the bins array.
     * @type {Array<!FilterEntry>|undefined}
     */
    this.filters = undefined;

    /**
     * The track title.
     * @type {string|undefined}
     */
    this.title = undefined;

    /**
     * The feature field used to sort positions in the track.
     * @type {string|undefined}
     */
    this.sortField = undefined;

    /**
     * The id of the originating data source.
     * @type {string|undefined}
     */
    this.sourceId = undefined;
  }

  /**
   * If the event is operating on selected features only.
   * @param {string|undefined} eventType The event type.
   * @return {boolean}
   */
  static isSelectedEvent(eventType) {
    return eventType != null && eventType.endsWith(':selected');
  }
}
