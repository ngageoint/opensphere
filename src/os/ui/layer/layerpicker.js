goog.provide('os.ui.layer.LayerPickerCtrl');
goog.provide('os.ui.layer.layerPickerDirective');

goog.require('os.ui.Module');


/**
 * Select2 to pick from all avaliable layers.
 * @return {angular.Directive}
 */
os.ui.layer.layerPickerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'layer': '=?',
      'layers': '=?',
      'isRequired': '=?',
      'layersFilter': '&?',
      'maxNumLayers': '@?',
      'formatter': '=?',
      'matcher': '=?',
      'placeholderText': '@?'
    },
    templateUrl: os.ROOT + 'views/layer/layerpicker.html',
    controller: os.ui.layer.LayerPickerCtrl,
    controllerAs: 'pickerCtrl'
  };
};


/**
 * Ass the directive to the module
 */
os.ui.Module.directive('layerpicker', [os.ui.layer.layerPickerDirective]);



/**
 * Controller for the layer picker
 * The selected layer will be saved in 'layer'. If multiple is allowed it will be stored in 'layers' as an array.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.layer.LayerPickerCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * Maximum selection size allowed.
   * @type {number}
   * @private
   */
  this.maxNumLayers_ = this.scope_['maxNumLayers'] ? this.scope_['maxNumLayers'] : 1;

  /**
   * Function that gets the desired descriptors in an array format for the select2.
   * If not in the scope it defaults to returning all descriptors.
   * @type {function(): !Array.<!os.data.IDataDescriptor>}
   */
  this.getLayersFunction = this.scope_['layersFilter'] ? this.scope_['layersFilter'] : this.getLayersList;

  /**
   * @type {string}
   * @private
   */
  this.placeholderText_ = this.scope_['placeholderText'] || ('Select Layer' + (this.multiple() ? 's' : '') + '...');

  /**
   * Array of available layers
   * @type {!Array.<!os.data.IDataDescriptor>}
   */
  this['layersList'] = this.getLayersFunction();

  var formatter = /** @type {Function} */ ($scope['formatter']) || this.select2Formatter_;
  var matcher = /** @type {Function} */ ($scope['matcher']) || this.matcher_;

  if (!goog.isDefAndNotNull($scope['isRequired'])) {
    // default the picker to required
    $scope['isRequired'] = true;
  }

  $timeout(function() {
    this.select2_ = $element.find('.js-layer-picker');
    this.select2_.select2({
      'placeholder': this.placeholderText_,
      'maximumSelectionSize': this.maxNumLayers_,
      'matcher': matcher,
      'formatSelection': formatter,
      'formatResult': formatter
    });
    this.layerSelected_();
  }.bind(this));
  this.scope_.$watch('layer', this.layerSelected_.bind(this));
  this.scope_.$watch('layers', this.layerSelected_.bind(this));
  this.scope_.$on('updateLayers', goog.bind(function() {
    this['layersList'] = this.getLayersFunction();
  }, this));
  this.scope_.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.select2_ = null;
};


/**
 * Layer selection is triggered, use the correct one
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.layerSelected_ = function() {
  if (goog.isDef(this.scope_['layer'])) {
    this.selectLayer_();
  } else {
    this.selectLayers_();
  }
};


/**
 * Select the layers based off the model
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.selectLayers_ = function() {
  if (this.select2_) {
    var vals = [];
    if (this.scope_['layers']) {
      goog.array.forEach(this.scope_['layers'], function(layer) {
        var found = goog.array.find(this['layersList'], function(l) {
          return l.getId() == layer.getId();
        });
        if (found) {
          vals.push(found['$$hashKey']);
        }
      }, this);
    }
    this.select2_.select2('val', vals);
  }
};


/**
 * Select the layers based off the model
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.selectLayer_ = function() {
  if (this.select2_) {
    var val = null;
    if (this.scope_['layer']) {
      var found = goog.array.find(this['layersList'], function(l) {
        return l.getId() == this.scope_['layer'].getId();
      }, this);
      if (found) {
        val = found['$$hashKey'];
      }
    }
    this.select2_.select2('val', val);
  }
};


/**
 * Get all the layers
 * TODO update this to auto add new descriptors when they are added (is this even necessary?)
 * @return {!Array.<!os.data.IDataDescriptor>}
 */
os.ui.layer.LayerPickerCtrl.prototype.getLayersList = function() {
  return os.dataManager.getDescriptors();
};


/**
 * @param {os.data.IDataDescriptor} layer
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.layerPicked = function(layer) {
  this.scope_['layer'] = layer;
  this.scope_.$emit('layerpicker.layerselected', layer);
};


/**
 * @param {!Array.<!os.data.IDataDescriptor>} layers
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.layersChanged = function(layers) {
  this.scope_['layers'] = layers;
};


/**
 * Returns if this allows multiple selection.
 * @return {boolean}
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.multiple = function() {
  return this.maxNumLayers_ != 1;
};


/**
 * Search result formatter. The select is actually storing the ID of each
 * descriptor. This function allows us to display the actual layer title.
 * @param {Object} item
 * @param {angular.JQLite} ele
 * @return {string|angular.JQLite}
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.select2Formatter_ = function(item, ele) {
  if (item) {
    var id = item['text'];
    var des = os.dataManager.getDescriptor(id);
    var val = '';
    if (des) {
      // include the explicit title here
      val = des.getTitle() + ' ' + (des.getExplicitTitle() || '');
      var color = des.getColor();
      color = color ? os.color.toHexString(color) : 'white';
      var description = des.getDescription() || 'No Description';
      val = '<span title="' + description + '"><i class="fa fa-bars" style="color:' + color +
          ';margin-right:5px;"></i>' + val;
      if (des.getProvider()) {
        // put the provider on each for clarity
        val += ' (' + des.getProvider() + ')';
      }
      val += '</span>';
    }
    return val;
  } else {
    return '';
  }
};


/**
 * Search term matcher for the select2. This is necessary because the select stores the id of each descriptor.
 * The ID is used in select2Formatter_ above to determine the correct name to display.
 * @param {string} term
 * @param {string} text
 * @param {angular.JQLite} option
 * @return {boolean}
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.matcher_ = function(term, text, option) {
  var des = os.dataManager.getDescriptor(text);
  if (des) {
    var layerTitle = des.getTitle() + ' ' + (des.getExplicitTitle() || '');
    if (layerTitle) {
      return goog.string.caseInsensitiveContains(layerTitle, term);
    }
  }
  return false;
};
