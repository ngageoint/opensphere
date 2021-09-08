goog.module('os.ui.layer.LobOptionsUI');

goog.require('os.ui.SliderUI');
goog.require('os.ui.UISwitchUI');
goog.require('os.ui.layer.EllipseOptionsUI');

const Delay = goog.require('goog.async.Delay');
const {ROOT} = goog.require('os');
const Fields = goog.require('os.Fields');
const VectorLayerArrowSize = goog.require('os.command.VectorLayerArrowSize');
const VectorLayerArrowUnits = goog.require('os.command.VectorLayerArrowUnits');
const VectorLayerBearing = goog.require('os.command.VectorLayerBearing');
const VectorLayerBearingError = goog.require('os.command.VectorLayerBearingError');
const VectorLayerBearingErrorColumn = goog.require('os.command.VectorLayerBearingErrorColumn');
const VectorLayerLOBColumnLength = goog.require('os.command.VectorLayerLOBColumnLength');
const VectorLayerLOBError = goog.require('os.command.VectorLayerLOBError');
const VectorLayerLOBLength = goog.require('os.command.VectorLayerLOBLength');
const VectorLayerLOBLengthError = goog.require('os.command.VectorLayerLOBLengthError');
const VectorLayerLOBLengthErrorUnits = goog.require('os.command.VectorLayerLOBLengthErrorUnits');
const VectorLayerLOBLengthUnits = goog.require('os.command.VectorLayerLOBLengthUnits');
const VectorLayerLOBMultiplier = goog.require('os.command.VectorLayerLOBMultiplier');
const VectorLayerLOBType = goog.require('os.command.VectorLayerLOBType');
const VectorLayerShowArrow = goog.require('os.command.VectorLayerShowArrow');
const VectorLayerShowEllipse = goog.require('os.command.VectorLayerShowEllipse');
const VectorLayerShowError = goog.require('os.command.VectorLayerShowError');
const {DEFAULT_RADIUS_COL_NAME, DEFAULT_SEMI_MAJ_COL_NAME, DEFAULT_SEMI_MIN_COL_NAME} = goog.require('os.fields');
const {MAX_LINE_LENGTH} = goog.require('os.geo');
const instanceOf = goog.require('os.instanceOf');
const {convertUnits} = goog.require('os.math');
const Units = goog.require('os.math.Units');
const VectorSource = goog.require('os.source.Vector');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const Module = goog.require('os.ui.Module');
const {getColumns} = goog.require('os.ui.layer');
const AbstractLayerUICtrl = goog.require('os.ui.layer.AbstractLayerUICtrl');


/**
 * The lob options directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/layer/loboptions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'loboptions';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the loboptions directive.
 * @unrestricted
 */
class Controller extends AbstractLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The Show Arrow checkbox state.
     * @type {boolean}
     */
    this['showArrow'] = false;

    /**
     * The Show Error checkbox state.
     * @type {boolean}
     */
    this['showError'] = false;

    /**
     * The Show ellipse checkbox state.
     * @type {boolean}
     */
    this['showEllipse'] = false;

    /**
     * The length type - whether to use a column or not
     * @type {string}
     */
    this['lengthType'] = osStyle.DEFAULT_LOB_LENGTH_TYPE;

    /**
     * The column used for the length multiplier
     * @type {string}
     */
    this['lengthColumn'] = '';

    /**
     * The column used for the length error
     * @type {string}
     */
    this['lengthErrorColumn'] = '';

    /**
     * The column used for the bearing
     * @type {string}
     */
    this['bearingColumn'] = '';

    /**
     * The column used for the bearing error
     * @type {string}
     */
    this['bearingErrorColumn'] = '';

    /**
     * The column used for the length units
     * @type {Units}
     */
    this['lengthUnits'] = osStyle.DEFAULT_UNITS;

    /**
     * The column used for the arrow length units
     * @type {Units}
     */
    this['arrowUnits'] = osStyle.DEFAULT_UNITS;

    /**
     * The column used for the length error units
     * @type {Units}
     */
    this['lengthErrorUnits'] = osStyle.DEFAULT_UNITS;

    /**
     * Units for distance measurements
     * @type {Array<Units>}
     */
    this['units'] = [];
    this.scope['maxSize'] = {};
    this.scope['maxSliderSize'] = {};
    for (var unit in Units) {
      this['units'].push(Units[unit]);
      this.scope['maxSize'][Units[unit]] = convertUnits(MAX_LINE_LENGTH, Units[unit],
          osStyle.DEFAULT_UNITS); // allow the spinner to go to the max range
      this.scope['maxSliderSize'][Units[unit]] = convertUnits(1000, Units[unit],
          Units.NAUTICAL_MILES); // cap the  slider at a smaller scale
    }

    this.scope['columnLength'] = osStyle.DEFAULT_LOB_LENGTH;
    this.scope['length'] = osStyle.DEFAULT_LOB_LENGTH;
    this.scope['size'] = osStyle.DEFAULT_ARROW_SIZE;
    this.scope['lengthErrorMultiplier'] = osStyle.DEFAULT_LOB_LENGTH_ERROR;
    this.scope['bearingErrorMultiplier'] = osStyle.DEFAULT_LOB_BEARING_ERROR;

    /**
     * @type {Delay}
     * @private
     */
    this.columnLengthDelay_ = new Delay(this.onColumnLengthDelay_, 1000, this);

    /**
     * @type {Delay}
     * @private
     */
    this.lengthErrorDelay_ = new Delay(this.onLengthErrorDelay_, 1000, this);

    /**
     * @type {Delay}
     * @private
     */
    this.bearingErrorDelay_ = new Delay(this.onBearingErrorDelay_, 1000, this);

    /**
     * @type {Delay}
     * @private
     */
    this.sizeDelay_ = new Delay(this.onSizeDelay_, 1000, this);

    /**
     * @type {string}
     */
    this['helpText'] = '<div><p>Line of Bearing Error allows you to show a +/- error range on the line length and ' +
        'orientation with arcs. Absence of bearing error shows lines instead of arcs. Absence of length error shows ' +
        'a single arc. Note that the bearing error is not accurate for line lengths greater than 10,000km!' +
        '</p><img class="c-loboptions-popover__image" src="' + ROOT + '/images/loberror.png"></img></div>';

    $scope.$on('length.slidestop', this.onLengthChange.bind(this));
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (!this.isDisposed()) {
      this['columns'] = this.getValue(getColumns);
      this['showArrow'] = this.getShowArrow_();
      this['showError'] = this.getShowError_();
      this['showEllipse'] = this.getShowEllipse_();
      this['lengthType'] = this.getLengthType_();
      this['lengthColumn'] = this.getLengthColumn_();
      this['lengthUnits'] = this.getLengthUnits_();
      this['arrowUnits'] = this.getArrowUnits_();
      this['lengthErrorColumn'] = this.getLengthErrorColumn_();
      this['lengthErrorUnits'] = this.getLengthErrorUnits_();
      this['bearingColumn'] = this.getBearingColumn_();
      this['bearingErrorColumn'] = this.getBearingErrorColumn_();
      this.scope['length'] = this.getLOBLength_();
      this.scope['columnLength'] = this.getLOBColumnLength_();
      this.scope['size'] = this.getSize_();
      this.scope['ellipseSupport'] = this.supportsEllipse();
      this.scope['lengthErrorMultiplier'] = this.getLengthErrorMultiplier_();
      this.scope['bearingErrorMultiplier'] = this.getBearingErrorMultiplier_();
    }
  }

  /**
   * Checks for ellipse support
   *
   * @return {boolean}
   * @protected
   */
  supportsEllipse() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    var layer = items[0].getLayer();
    if (layer) {
      var source = /** @type {os.layer.Vector} */ (layer).getSource();
      if (source && instanceOf(source, VectorSource.NAME)) {
        source = /** @type {!os.source.Vector} */ (source);
        if (!source.hasColumn(Fields.RADIUS) && !source.hasColumn(DEFAULT_RADIUS_COL_NAME) &&
            (!source.hasColumn(Fields.SEMI_MAJOR) || !source.hasColumn(Fields.SEMI_MINOR)) &&
            (!source.hasColumn(DEFAULT_SEMI_MAJ_COL_NAME) ||
            !source.hasColumn(DEFAULT_SEMI_MIN_COL_NAME))) {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * The lob arrow size
   *
   * @return {number}
   * @private
   */
  getSize_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.ARROW_SIZE];
      }
    }

    return osStyle.DEFAULT_ARROW_SIZE;
  }

  /**
   * The lob length
   *
   * @return {number}
   * @private
   */
  getLOBLength_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH];
      }
    }

    return osStyle.DEFAULT_LOB_LENGTH;
  }

  /**
   * The lob column length
   *
   * @return {number}
   * @private
   */
  getLOBColumnLength_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_COLUMN_LENGTH];
      }
    }

    return osStyle.DEFAULT_LOB_LENGTH;
  }

  /**
   * The lob length error multipler
   *
   * @return {number}
   * @private
   */
  getLengthErrorMultiplier_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_ERROR];
      }
    }

    return osStyle.DEFAULT_LOB_LENGTH_ERROR;
  }

  /**
   * The lob length error units
   *
   * @return {string}
   * @private
   */
  getLengthErrorUnits_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_ERROR_UNITS];
      }
    }

    return osStyle.DEFAULT_UNITS;
  }

  /**
   * The lob bearing error multipler
   *
   * @return {number}
   * @private
   */
  getBearingErrorMultiplier_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_BEARING_ERROR];
      }
    }

    return osStyle.DEFAULT_LOB_BEARING_ERROR;
  }

  /**
   * The type for the lob length
   *
   * @return {string}
   * @private
   */
  getLengthType_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_TYPE];
      }
    }

    return osStyle.DEFAULT_LOB_LENGTH_TYPE;
  }

  /**
   * The column for the lob length multiplier
   *
   * @return {string}
   * @private
   */
  getLengthColumn_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_COLUMN];
      }
    }

    return '';
  }

  /**
   * The column for the lob length units
   *
   * @return {string}
   * @private
   */
  getLengthUnits_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_UNITS];
      }
    }

    return osStyle.DEFAULT_UNITS;
  }

  /**
   * The column for the lob length error
   *
   * @return {string}
   * @private
   */
  getLengthErrorColumn_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_LENGTH_ERROR_COLUMN];
      }
    }

    return '';
  }

  /**
   * The column for the lob bearing
   *
   * @return {string}
   * @private
   */
  getBearingColumn_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_BEARING_COLUMN];
      }
    }

    return '';
  }

  /**
   * The column for the lob bearing error
   *
   * @return {string}
   * @private
   */
  getBearingErrorColumn_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.LOB_BEARING_ERROR_COLUMN];
      }
    }

    return '';
  }

  /**
   * If arrow should be displayed for the layer(s).
   *
   * @return {boolean}
   * @private
   */
  getShowArrow_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_ARROW];
      }
    }

    return false;
  }

  /**
   * The column for the lob length units
   *
   * @return {string}
   * @private
   */
  getArrowUnits_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.ARROW_UNITS];
      }
    }

    return osStyle.DEFAULT_UNITS;
  }

  /**
   * If error should be displayed for the layer(s).
   *
   * @return {boolean}
   * @private
   */
  getShowError_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_ERROR];
      }
    }

    return false;
  }

  /**
   * If ellipse should be displayed for the layer(s).
   *
   * @return {boolean}
   * @private
   */
  getShowEllipse_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_ELLIPSE];
      }
    }

    return false;
  }

  /**
   * Handle changes to the Show Arrow option.
   *
   * @export
   */
  onShowArrowChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['showArrow'];
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new VectorLayerShowArrow(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handle changes to the Show error option.
   *
   * @export
   */
  onShowErrorChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['showError'];
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new VectorLayerShowError(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handle changes to the Show Arrow option.
   *
   * @export
   */
  onShowEllipseChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['showEllipse'];
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new VectorLayerShowEllipse(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles changes to arrow size
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @export
   */
  onSizeChange(event, value) {
    if (!this.isDisposed()) {
      this.sizeDelay_.start();
    }
  }

  /**
   * Actually creates the command after the arrow size delay fires
   *
   * @private
   */
  onSizeDelay_() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerArrowSize(layer.getId(), this.scope['size']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles changes to lob length
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @export
   */
  onLengthChange(event, value) {
    if (event) {
      event.stopPropagation();
    }
    var result = value !== undefined ? value : this.scope['length'];
    this.scope['length'] = result == 0 ? 1 : result;
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBLength(layer.getId(), this.scope['length']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles changes to lob column length
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @export
   */
  onColumnLengthChange(event, value) {
    if (!this.isDisposed()) {
      this.columnLengthDelay_.start();
    }
  }

  /**
   * Actually creates the command after the lob length delay fires
   *
   * @private
   */
  onColumnLengthDelay_() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBColumnLength(layer.getId(), this.scope['columnLength']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles changes to bearing error multiplier
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @export
   */
  onBearingErrorChange(event, value) {
    if (!this.isDisposed()) {
      this.bearingErrorDelay_.start();
    }
  }

  /**
   * Actually creates the command after the bearing error multiplier delay fires
   *
   * @private
   */
  onBearingErrorDelay_() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerBearingError(layer.getId(), this.scope['bearingErrorMultiplier']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles changes to bearing error multiplier
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @export
   */
  onLengthErrorChange(event, value) {
    if (!this.isDisposed()) {
      this.lengthErrorDelay_.start();
    }
  }

  /**
   * Actually creates the command after the bearing error multiplier delay fires
   *
   * @private
   */
  onLengthErrorDelay_() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBLengthError(layer.getId(), this.scope['lengthErrorMultiplier']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles column changes to the lob length multiplier
   *
   * @export
   */
  onLengthColumnChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBMultiplier(layer.getId(), this['lengthColumn']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles column changes to the lob length error
   *
   * @export
   */
  onLengthErrorColumnChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBError(layer.getId(), this['lengthErrorColumn']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles changes to the length type
   *
   * @export
   */
  onLengthTypeChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBType(layer.getId(), this['lengthType']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles column changes to the bearing
   *
   * @export
   */
  onBearingColumnChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerBearing(layer.getId(), this['bearingColumn']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles column changes to the bearing error
   *
   * @export
   */
  onBearingErrorColumnChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerBearingErrorColumn(layer.getId(), this['bearingErrorColumn']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles length unit changes
   *
   * @export
   */
  onLengthUnitChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBLengthUnits(layer.getId(), this['lengthUnits']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles arrow unit changes
   *
   * @export
   */
  onArrowUnitChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerArrowUnits(layer.getId(), this['arrowUnits']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Handles length error unit changes
   *
   * @export
   */
  onLengthErrorUnitChange() {
    /**
     * @param {os.layer.ILayer} layer
     * @return {os.command.ICommand}
     */
    var fn = function(layer) {
      return new VectorLayerLOBLengthErrorUnits(layer.getId(), this['lengthErrorUnits']);
    }.bind(this);

    this.createCommand(fn);
  }

  /**
   * Adds ellipse options when rendering ellispe
   *
   * @return {string}
   * @export
   */
  getEllipseUI() {
    return 'ellipseoptions';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
