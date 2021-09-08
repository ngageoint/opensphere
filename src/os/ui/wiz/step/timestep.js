goog.module('os.ui.wiz.step.TimeStep');

const TimeType = goog.require('os.im.mapping.TimeType');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const TimeMappingModel = goog.require('os.ui.im.mapping.time.TimeMappingModel');
const AbstractWizardStep = goog.require('os.ui.wiz.step.AbstractWizardStep');
const {directiveTag: stepUi} = goog.require('os.ui.wiz.step.TimeStepUI');


/**
 * Import wizard time step
 * @unrestricted
 */
class TimeStep extends AbstractWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.template = `<${stepUi}></${stepUi}>`;
    this.title = 'Time';

    /**
     * @type {string}
     */
    this['timeType'] = 'none';

    /**
     * @type {TimeMappingModel}
     */
    this['startModel'] = new TimeMappingModel();

    /**
     * @type {TimeMappingModel}
     */
    this['endModel'] = new TimeMappingModel(TimeType.END);
  }

  /**
   * @inheritDoc
   */
  initialize(config) {
    if (!this.initialized && config['mappings'] && config['mappings'].length > 0) {
      var startMappings = [];
      var endMappings = [];

      // find all time mappings, separating them by type
      var i = config['mappings'].length;
      while (i--) {
        var m = config['mappings'][i];
        if (m instanceof DateTimeMapping) {
          var dtm = /** @type {DateTimeMapping} */ (m);
          if (dtm.getType() == TimeType.END) {
            endMappings.push(m);
          } else {
            startMappings.push(m);
          }
        }
      }

      // update configuration from the mappings
      if (startMappings.length > 0) {
        this['startModel'].updateFromMappings(startMappings);
        this['timeType'] = 'instant';
      }

      if (endMappings.length > 0) {
        this['endModel'].updateFromMappings(endMappings);
        this['timeType'] = 'range';
      }

      super.initialize(config);
    }
  }

  /**
   * @inheritDoc
   */
  finalize(config) {
    // remove previous time mappings
    if (config['mappings']) {
      var i = config['mappings'].length;
      while (i--) {
        var m = config['mappings'][i];
        if (m instanceof DateTimeMapping) {
          config['mappings'].splice(i, 1);
        }
      }
    }

    // generate mappings from the UI
    var mappings = [];
    if (this['timeType'] != 'none') {
      config['skipTimeMappings'] = false;
      if (this['timeType'] == 'instant') {
        this['startModel'].setType(TimeType.INSTANT);
        mappings = mappings.concat(this['startModel'].generateMappings());
      } else if (this['timeType'] == 'range') {
        this['startModel'].setType(TimeType.START);
        mappings = mappings.concat(this['startModel'].generateMappings());
        mappings = mappings.concat(this['endModel'].generateMappings());
      }

      // add new time mapping(s)
      if (mappings.length > 0) {
        if (config['mappings']) {
          config['mappings'] = config['mappings'].concat(mappings);
        } else {
          config['mappings'] = mappings;
        }
      }
    } else {
      // indicate the time mapping needs to be removed
      config['skipTimeMappings'] = true;
    }
  }

  /**
   * @inheritDoc
   */
  isValid(config) {
    if (this['timeType'] == 'instant') {
      return this.valid && this['startModel'].validate();
    } else if (this['timeType'] == 'range') {
      return this.valid && this['startModel'].validate() && this['endModel'].validate();
    }

    // no time - always valid
    return true;
  }
}

exports = TimeStep;
