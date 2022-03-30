goog.declareModuleId('os.style.IconReader');

import {asString} from 'ol/src/color.js';
import {toDegrees, toRadians} from 'ol/src/math.js';
import IconStyle from 'ol/src/style/Icon.js';
import IconAnchorUnits from 'ol/src/style/IconAnchorUnits.js';
import IconOrigin from 'ol/src/style/IconOrigin.js';

import CrossOrigin from '../net/crossorigin.js';
import {getCrossOrigin} from '../net/net.js';
import {GMAPS_SEARCH, getMirror, replaceExportableUri, replaceGoogleUri} from '../ui/file/kml/kml.js';
import AbstractReader from './abstractreader.js';

import Icon from './iconstyle.js';
import {DEFAULT_ICON, DEFAULT_ICON_OPTIONS} from './styledefaults.js';

const Uri = goog.require('goog.Uri');
const {hashCode} = goog.require('goog.string');
const {IE} = goog.require('goog.userAgent');


/**
 * Icon style reader
 *
 * @extends {AbstractReader<!IconStyle>}
 */
class IconReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.baseHash = 31 * this.baseHash + hashCode('icon') >>> 0;
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    IconReader.translateIcons(config);
    if (config['fill'] && config['fill']['color']) {
      config['color'] = config['fill']['color'];
    }
    var iconOptions = config['options'] || undefined;
    var hash = 31 * this.baseHash + hashCode(JSON.stringify(config)) >>> 0;
    if (!this.cache[hash]) {
      var options = /** @type {olx.style.IconOptions} */ ({
        anchor: config['anchor'],
        anchorOrigin: config['anchorOrigin'],
        anchorXUnits: config['anchorXUnits'],
        anchorYUnits: config['anchorYUnits'],
        color: config['color'],
        offset: config['offset'],
        offsetOrigin: config['offsetOrigin'],
        options: iconOptions,
        rotation: config['rotation'],
        scale: config['scale'],
        size: config['size'],
        src: config['src']
      });

      var remote = new Uri(options.src);
      options.crossOrigin = getCrossOrigin(remote);

      // Internet Explorer does not accept crossOrigin: 'none', and it should be omitted for that case
      if (IE && options.crossOrigin === CrossOrigin.NONE) {
        options.crossOrigin = undefined;
      }

      this.cache[hash] = new Icon(options);
      this.cache[hash]['id'] = hash;
    }

    return /** @type {!IconStyle} */ (this.cache[hash]);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  toConfig(style, obj) {
    if (style instanceof IconStyle) {
      var iconStyle = /** @type {IconStyle} */ (style);

      obj['type'] = 'icon';

      // only add things if they differ from the default

      // we want the original anchor and not the normalized one, which is why
      // we are not calling getAnchor()
      var anchor = iconStyle.anchor_;

      if (anchor && anchor[0] != 0.5 && anchor[1] != 0.5) {
        obj['anchor'] = anchor;
      }

      var anchorOrigin = iconStyle.anchorOrigin_;

      if (anchorOrigin && anchorOrigin != IconOrigin.TOP_LEFT) {
        obj['anchorOrigin'] = anchorOrigin;
      }

      var anchorXUnits = iconStyle.anchorXUnits_;

      if (anchorXUnits && anchorXUnits != IconAnchorUnits.FRACTION) {
        obj['anchorXUnits'] = anchorXUnits;
      }

      var anchorYUnits = iconStyle.anchorYUnits_;

      if (anchorYUnits && anchorYUnits != IconAnchorUnits.FRACTION) {
        obj['anchorYUnits'] = anchorYUnits;
      }

      if (style.iconImage_ && style.iconImage_.color_) {
        obj['color'] = asString(style.iconImage_.color_);
      }

      var offset = iconStyle.offset_;

      if (offset && offset[0] !== 0 && offset[1] !== 0) {
        obj['offset'] = offset;
      }

      var offsetOrigin = iconStyle.offsetOrigin_;

      if (offsetOrigin && offsetOrigin != IconOrigin.TOP_LEFT) {
        obj['offsetOrigin'] = offsetOrigin;
      }

      var rotation = iconStyle.rotation_;

      if (rotation !== undefined && rotation !== 0) {
        obj['rotation'] = rotation;
      }

      var scale = iconStyle.scale_;

      if (scale !== undefined && scale !== 1) {
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

      var options = iconStyle['options'] || undefined;

      if (options) {
        obj['options'] = options;
      }
    }
  }

  /**
   * Translates common map icons from the Internet to our local versions. We do this for two reasons:
   *   1. Those URLs will be inaccessible on other networks
   *   2. To avoid cross-origin security restrictions that result in a tainted canvas
   *
   * @param {!Object<string, *>} config
   */
  static translateIcons(config) {
    // fall back to the default icon if none provided
    if (!config['src']) {
      config['src'] = DEFAULT_ICON;
    }

    if (config['rotation']) {
      // convert to degrees, round it, and convert back to radians
      config['rotation'] = toRadians(Math.round(toDegrees(/** @type {number} */ (config['rotation']))));
    }

    // replace google maps/earth icon urls with our copies
    var src = /** @type {string|undefined} */ (config['src']);
    if (src) {
      const isGmaps = GMAPS_SEARCH.test(src);
      const isMirror = src.indexOf(getMirror()) != -1;
      if (isGmaps || isMirror) {
        if (isGmaps) {
          config['src'] = replaceGoogleUri(src);
        } else {
          config['src'] = replaceExportableUri(src);
        }

        // if an anchor was not specified, fix it (because failing at "Pin the tail on the donkey" is embarrassing)
        if (!config['anchor'] && src.indexOf('/pushpin/') > -1) {
          config['anchor'] = [0.33, 0.07];
          config['anchorOrigin'] = IconOrigin.BOTTOM_LEFT;
          config['anchorXUnits'] = IconAnchorUnits.FRACTION;
          config['anchorYUnits'] = IconAnchorUnits.FRACTION;
        }

        if (!config['anchor'] && src.indexOf('/paddle/') > -1) {
          if (src.indexOf('-lv') > -1) {
            config['scale'] = 0.5;
          } else {
            config['anchor'] = [0.5, 0.07];
            config['anchorOrigin'] = IconOrigin.BOTTOM_LEFT;
            config['anchorXUnits'] = IconAnchorUnits.FRACTION;
            config['anchorYUnits'] = IconAnchorUnits.FRACTION;
          }
        }
      }
    }
  }
}

/**
 * The default icon (white circle).
 * @type {string}
 * @deprecated Please use os.style.defaults.DEFAULT_ICON instead.
 */
IconReader.DEFAULT_ICON = DEFAULT_ICON;

/**
 * Default icon options.
 * @type {!olx.style.IconOptions}
 * @deprecated Please use os.style.defaults.DEFAULT_ICON_OPTIONS instead.
 */
IconReader.DEFAULT_ICON_OPTIONS = DEFAULT_ICON_OPTIONS;

export default IconReader;
