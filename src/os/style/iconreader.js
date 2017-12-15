goog.provide('os.style.IconReader');

goog.require('goog.Uri');
goog.require('ol.color');
goog.require('ol.style.Icon');
goog.require('ol.style.IconAnchorUnits');
goog.require('ol.style.IconOrigin');
goog.require('os.net');
goog.require('os.style.AbstractReader');
goog.require('os.style.Icon');
goog.require('os.ui.file.kml');



/**
 * Icon style reader
 * @extends {os.style.AbstractReader<!ol.style.Icon>}
 * @constructor
 */
os.style.IconReader = function() {
  os.style.IconReader.base(this, 'constructor');
};
goog.inherits(os.style.IconReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.IconReader.prototype.getOrCreateStyle = function(config) {
  os.style.IconReader.translateIcons(config);

  var hash = this.baseHash;
  for (var key in config) {
    if (goog.isDef(config[key])) {
      hash += goog.string.hashCode(config[key].toString());
    }
  }

  if (!this.cache[hash]) {
    var options = /** @type {olx.style.IconOptions} */ ({
      anchor: config['anchor'],
      anchorOrigin: config['anchorOrigin'],
      anchorXUnits: config['anchorXUnits'],
      anchorYUnits: config['anchorYUnits'],
      color: config['color'],
      offset: config['offset'],
      offsetOrigin: config['offsetOrigin'],
      rotation: config['rotation'],
      scale: config['scale'],
      size: config['size'],
      src: config['src']
    });

    var remote = new goog.Uri(options.src);
    options.crossOrigin = os.net.getCrossOrigin(remote);

    // Internet Explorer does not accept crossOrigin: 'none', and it should be omitted for that case
    if (goog.userAgent.IE && options.crossOrigin === os.net.CrossOrigin.NONE) {
      options.crossOrigin = undefined;
    }

    this.cache[hash] = new os.style.Icon(options);
    this.cache[hash]['id'] = hash;
  }

  return /** @type {!ol.style.Icon} */ (this.cache[hash]);
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.style.IconReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Icon) {
    var iconStyle = /** @type {ol.style.Icon} */ (style);

    obj['type'] = 'icon';

    // only add things if they differ from the default

    // we want the original anchor and not the normalized one, which is why
    // we are not calling getAnchor()
    var anchor = iconStyle.anchor_;

    if (anchor && anchor[0] != 0.5 && anchor[1] != 0.5) {
      obj['anchor'] = anchor;
    }

    var anchorOrigin = iconStyle.anchorOrigin_;

    if (anchorOrigin && anchorOrigin != ol.style.IconOrigin.TOP_LEFT) {
      obj['anchorOrigin'] = anchorOrigin;
    }

    var anchorXUnits = iconStyle.anchorXUnits_;

    if (anchorXUnits && anchorXUnits != ol.style.IconAnchorUnits.FRACTION) {
      obj['anchorXUnits'] = anchorXUnits;
    }

    var anchorYUnits = iconStyle.anchorYUnits_;

    if (anchorYUnits && anchorYUnits != ol.style.IconAnchorUnits.FRACTION) {
      obj['anchorYUnits'] = anchorYUnits;
    }

    if (style.iconImage_ && style.iconImage_.color_) {
      obj['color'] = ol.color.asString(style.iconImage_.color_);
    }

    var offset = iconStyle.offset_;

    if (offset && offset[0] !== 0 && offset[1] !== 0) {
      obj['offset'] = offset;
    }

    var offsetOrigin = iconStyle.offsetOrigin_;

    if (offsetOrigin && offsetOrigin != ol.style.IconOrigin.TOP_LEFT) {
      obj['offsetOrigin'] = offsetOrigin;
    }

    var rotation = iconStyle.rotation_;

    if (goog.isDef(rotation) && rotation !== 0) {
      obj['rotation'] = rotation;
    }

    var scale = iconStyle.scale_;

    if (goog.isDef(scale) && scale !== 1) {
      obj['scale'] = scale;
    }

    var size = iconStyle.getSize();

    if (size) {
      obj['size'] = size;
    }

    var src = iconStyle.getSrc();

    if (src) {
      obj['src'] = src;
    }
  }
};


/**
 * Translates common map icons from the Internet to our local versions. We do this for two reasons:
 *   1. Those URLs will be inaccessible on other networks
 *   2. To avoid cross-origin security restrictions that result in a tainted canvas
 *
 * @param {Object<string, *>} config
 */
os.style.IconReader.translateIcons = function(config) {
  // fall back to the default icon if none provided
  if (!config['src']) {
    config['src'] = os.style.IconReader.DEFAULT_ICON;
  }

  // replace google maps/earth icon urls with our copies
  var src = /** @type {string|undefined} */ (config['src']);
  if (src) {
    if (os.ui.file.kml.GMAPS_SEARCH.test(src)) {
      config['src'] = os.ui.file.kml.replaceGoogleUri(src);

      // if an anchor was not specified, fix it (because failing at "Pin the tail on the donkey" is embarrassing)
      if (!config['anchor'] && src.indexOf('/pushpin/') > -1) {
        config['anchor'] = [0.33, 0.07];
        config['anchorOrigin'] = ol.style.IconOrigin.BOTTOM_LEFT;
        config['anchorXUnits'] = ol.style.IconAnchorUnits.FRACTION;
        config['anchorYUnits'] = ol.style.IconAnchorUnits.FRACTION;
      }

      if (!config['anchor'] && src.indexOf('/paddle/') > -1) {
        if (src.indexOf('-lv') > -1) {
          config['scale'] = 0.5;
        } else {
          config['anchor'] = [0.5, 0.07];
          config['anchorOrigin'] = ol.style.IconOrigin.BOTTOM_LEFT;
          config['anchorXUnits'] = ol.style.IconAnchorUnits.FRACTION;
          config['anchorYUnits'] = ol.style.IconAnchorUnits.FRACTION;
        }
      }
    }
  }
};


/**
 * The default icon (white circle).
 * @type {string}
 */
os.style.IconReader.DEFAULT_ICON = os.ui.file.kml.replaceGoogleUri(os.ui.file.kml.DEFAULT_ICON_PATH);


/**
 * Default icon options.
 * @type {!olx.style.IconOptions}
 */
os.style.IconReader.DEFAULT_ICON_OPTIONS = {
  src: os.style.IconReader.DEFAULT_ICON,

  // clear these out so the default icon displays correctly
  anchorOrigin: undefined,
  anchorXUnits: undefined,
  anchorYUnits: undefined,
  crossOrigin: undefined,
  offset: undefined,
  offsetOrigin: undefined,
  rotation: undefined,
  size: undefined,
  imgSize: undefined
};
