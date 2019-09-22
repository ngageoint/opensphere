goog.provide('os.ui.layer.LayerPickerCtrl');
goog.provide('os.ui.layer.layerPickerDirective');

goog.require('ol.array');
goog.require('os.array');
goog.require('os.ui.Module');


/**
 * Select2 to pick from all avaliable layers.
 *
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
      'groupFn': '=?',
      'placeholderText': '@?',
      'emitName': '@?'
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
 *
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
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * Maximum selection size allowed.
   * @type {number}
   * @private
   */
  this.maxNumLayers_ = this.scope_['maxNumLayers'] ? this.scope_['maxNumLayers'] : 1;

  /**
   * Function that gets the desired descriptors in an array format for the select2.
   * If not in the scope it defaults to returning all descriptors.
   * @type {function(): !Array.<(!os.data.IDataDescriptor|!os.filter.IFilterable)>}
   */
  this.getLayersFunction = this.scope_['layersFilter'] ? this.scope_['layersFilter'] : this.getLayersList;

  /**
   * @type {string}
   * @private
   */
  this.placeholderText_ = this.scope_['placeholderText'] || ('Select Layer' + (this.multiple() ? 's' : '') + '...');

  /**
   * @type {string}
   * @private
   */
  this.emitName_ = this.scope_['emitName'] != null ? this.scope_['emitName'] : 'layerpicker';

  /**
   * @type {!Object<string, (os.data.IDataDescriptor|os.filter.IFilterable)>}
   * @private
   */
  this.layerIndex_ = {};

  /**
   * Optional override grouping function for the select.
   * @type {function((os.data.IDataDescriptor|os.filter.IFilterable)):?string}
   * @private
   */
  this.groupFn_ = $scope['groupFn'];

  /**
   * Array of available layers
   * @type {!Array<!os.data.IDataDescriptor>}
   */
  this['layersList'] = [];
  this.updateLayers();

  var formatter = /** @type {Function} */ ($scope['formatter'] || this.select2Formatter_).bind(this);
  var matcher = /** @type {Function} */ ($scope['matcher'] || this.matcher_).bind(this);

  if ($scope['isRequired'] == null) {
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

    this.multiple() ? this.initLayers_() : this.initLayer_();
  }.bind(this));

  this.scope_.$on('updateLayers', this.updateLayers.bind(this));
  this.scope_.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 *
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.select2_ = null;
};


/**
 * Updates the layers list.
 */
os.ui.layer.LayerPickerCtrl.prototype.updateLayers = function() {
  this['layersList'] = this.getLayersFunction();
  this.layerIndex_ = {};

  this['layersList'].forEach(function(l) {
    this.layerIndex_[l.getId()] = l;
  }, this);
};


/**
 * Select the layers based off the model
 *
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.initLayers_ = function() {
  if (this.select2_) {
    var vals = [];
    if (this.scope_['layers']) {
      os.array.forEach(this.scope_['layers'], function(layer) {
        var found = ol.array.find(this['layersList'], function(l) {
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
 *
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.initLayer_ = function() {
  if (this.select2_) {
    var val = null;
    if (this.scope_['layer']) {
      var found = ol.array.find(this['layersList'], function(l) {
        return l.getId() == this.scope_['layer'].getId();
      }.bind(this));

      if (found) {
        val = found['$$hashKey'];
      }
    }

    this.select2_.select2('val', val);
  }
};


/**
 * @param {os.data.IDataDescriptor} layer
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.layerPicked = function(layer) {
  this.scope_['layer'] = layer;
  this.scope_.$emit(this.emitName_ + '.layerselected', layer);
};


/**
 * @param {!Array.<!os.data.IDataDescriptor>} layers
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.layersChanged = function(layers) {
  this.scope_['layers'] = layers;
  this.timeout_(function() { // give the scope a chance to update
    this.scope_.$emit(this.emitName_ + '.layerschanged', layers);
  }.bind(this));
};


/**
 * Returns if this allows multiple selection.
 *
 * @return {boolean}
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.multiple = function() {
  return this.maxNumLayers_ != 1;
};


/**
 * Get all the layers
 *
 * @return {!Array.<!os.data.IDataDescriptor>}
 */
os.ui.layer.LayerPickerCtrl.prototype.getLayersList = function() {
  return os.dataManager.getDescriptors();
};


/**
 * Returns the group name for the layer.
 *
 * @param {os.data.IDataDescriptor|os.filter.IFilterable} layer The layer to group.
 * @return {?string}
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.getGroup = function(layer) {
  if (this.groupFn_) {
    // if we have a group fn passed in, use it
    return this.groupFn_(layer);
  }

  return os.ui.layer.LayerPickerCtrl.layerGroupFn(layer);
};


/**
 * Returns the ID for the layer.
 *
 * @param {os.data.IDataDescriptor|os.filter.IFilterable} layer The layer.
 * @return {?string}
 * @export
 */
os.ui.layer.LayerPickerCtrl.prototype.getLayerId = function(layer) {
  return layer ? layer.getId() : null;
};


/**
 * Search result formatter. The select is actually storing the ID of each
 * descriptor. This function allows us to display the actual layer title.
 *
 * @param {Object} item
 * @param {angular.JQLite} ele
 * @return {string|angular.JQLite}
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.select2Formatter_ = function(item, ele) {
  if (item['children']) {
    // it's an optgroup, so just return the label
    var text = item['text'];
    if (text === '') {
      // an empty optgroup should be hidden, or they look ugly
      ele.hide();
    }

    return text;
  }

  var val = '';

  if (ele) {
    var id = /** @type {string} */ (item['text']);
    var layer = this.layerIndex_[id];
    var title;
    var color;
    var description;
    var provider;
    var explicitType;

    if (layer instanceof os.data.BaseDescriptor) {
      var des = /** @type {os.data.BaseDescriptor} */ (layer);
      title = layer.getTitle();
      color = des.getColor() ? os.color.toHexString(des.getColor()) : 'white';
      description = os.ui.escapeHtml(des.getDescription() || 'No Description');
      provider = des.getProvider() ? ' (' + des.getProvider() + ')' : '';

      explicitType = des.getExplicitTitle() ? ' ' + des.getExplicitTitle() : '';
      if (explicitType == ' Tiles and Features') {
        // the fact that a descriptor is for both tiles and features is irrelevant here, simplify if down
        explicitType = ' Features';
      }
    } else if (layer instanceof os.layer.Vector) {
      title = layer.getTitle();
      color = /** @type {string} */ (layer.getLayerOptions()['color']);
      color = color ? os.color.toHexString(color) : 'white';
      description = 'No Description';
      provider = layer.getProvider() ? ' (' + layer.getProvider() + ')' : '';
      explicitType = layer.getExplicitType() ? ' ' + layer.getExplicitType() : '';
    }

    val = '<span title="' + description + '"><i class="fa fa-bars mr-1" style="color:' + color +
          ';"></i>' + title + explicitType + provider + '</span>';
  }

  return val || '';
};


/**
 * Search term matcher for the select2. This is necessary because the select stores the id of each descriptor.
 * The ID is used in select2Formatter_ above to determine the correct name to display.
 *
 * @param {string} term
 * @param {string} text
 * @param {angular.JQLite} option
 * @return {boolean}
 * @private
 */
os.ui.layer.LayerPickerCtrl.prototype.matcher_ = function(term, text, option) {
  var id = option.text();

  if (!id) {
    // ng-options introduces an empty option element for some reason, get rid of it
    return false;
  }

  var layer = this.layerIndex_[id];
  var title;

  if (layer instanceof os.data.BaseDescriptor) {
    title = layer.getTitle() + ' ' + (layer.getExplicitTitle() || '');
  } else if (os.implements(layer, os.filter.IFilterable.ID)) {
    var filterable = /** @type {os.filter.IFilterable} */ (layer);
    title = filterable.getTitle();
  }

  return title ? goog.string.caseInsensitiveContains(title, term) : true;
};


/**
 * Returns the group name for the layer.
 *
 * @param {os.data.IDataDescriptor|os.filter.IFilterable} layer The layer to group.
 * @return {?string}
 */
os.ui.layer.LayerPickerCtrl.layerGroupFn = function(layer) {
  return layer instanceof os.data.BaseDescriptor ? 'Inactive' : 'Active';
};
