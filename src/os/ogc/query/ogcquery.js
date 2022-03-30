goog.declareModuleId('os.ogc.query.OGCQuery');

import '../../ui/ogc/ogclistui.js';
import * as query from '../../query/query.js';
import * as ConfirmUI from '../../ui/window/confirm.js';

const {default: OGCService} = goog.requireType('os.ogc.OGCService');
const {Options: OGCListUIOptions} = goog.requireType('os.ui.ogc.OGCListUI');


/**
 * Generic UI and handlers for an OGC Query
 */
export default class OGCQuery {
  /**
   * @param {!OGCService} service
   */
  constructor(service) {
    /**
     * @type {OGCService}
     */
    this.service = service;

    /**
     * @type {?OGCListUIOptions}
     * @protected
     */
    this.options_;

    /**
     * @type {string}
     * @protected
     */
    this.eventType_ = 'ogcQuery';
  }

  /**
   * Handle a area being chosen in the import area border dialog.
   * @param {function(Feature)} callback The callback to fire when the area is loaded
   * @param {Array<!Feature>} data The requested area (array because select2 supports multi-select)
   * @private
   */
  onChoice_(callback, data) {
    if (data && data.length > 0) {
      if (this.service) {
        this.service
            .get(data[0])
            .then(callback);
      }
    }
  }

  /**
   * Handle area being loaded from the server. Insert into the Area manager.
   * @param {!Feature} feature The area border feature
   * @private
   */
  onLoaded_(feature) {
    if (this.service) {
      feature = this.service.populateFeature(feature);
      feature.getGeometry().osTransform();
      query.addArea(feature);
    }
  }

  /**
   * @param {OGCListUIOptions=} opt_options
   */
  init(opt_options) {
    this.options_ = opt_options || null;
  }

  /**
   * Launch a confirmation dialog to pick area to import.
   * @param {!string} title
   * @param {!string} message
   * @param {string=} opt_icon
   * @param {function(Feature)=} opt_callback Callback to fire when the area is chosen and available
   */
  launchImport(title, message, opt_icon, opt_callback) {
    // inject this callback into the confirmation callback since it will be used there
    var onLoaded = opt_callback || this.onLoaded_.bind(this);
    var onConfirm = this.onChoice_.bind(this, onLoaded);

    var msgTemplate = `<span>${message}</span>`;
    var strService = (this.service) ? this.service.getServiceId() : '';
    var ccTemplate = `<ogclist value="confirmValue" is-required="true" service="${strService}"></ogclist>`;

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: onConfirm,
      prompt: msgTemplate + ccTemplate,
      windowOptions: {
        'label': title,
        'icon': 'fa ' + opt_icon,
        'x': 'center',
        'y': 'center',
        'width': '300',
        'height': 'auto',
        'modal': 'true',
        'show-close': 'true'
      }
    }));
  }

  /**
   * Calls launchImport() with default parameters; override this for maximum utility
   * @param {function(Feature)=} opt_callback Callback to fire when the area is chosen and available
   * @param {OGCListUIOptions=} opt_options Will use the init() options, the defaults, or these (temporarily)
   */
  launch(opt_callback, opt_options) {
    const options = opt_options || this.options_ || {};

    this.launchImport(
        options.label || 'Choose Area',
        options.text || 'Please select an area to load:',
        options.icon || 'fa-square-o',
        opt_callback
    );
  }

  /**
   * Simple key for MenuItem
   * @return {string}
   */
  getEventType() {
    const id = (this.service) ? this.service.getServiceId() : '*';
    return [this.eventType_, id].join(':');
  }

  /**
   * @param {string} eventType
   */
  setEventType(eventType) {
    this.eventType_ = eventType;
  }
}
