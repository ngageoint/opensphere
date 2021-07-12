goog.module('os.ui.file.kml');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');

/**
 * Refresh modes for KML links and icons.
 *
 * From the KML spec:
 * onChange:   (default) Refresh when the file is loaded and whenever the Link parameters change.
 * onInterval: Refresh every n seconds (specified in `<refreshInterval>`).
 * onExpire:   Refresh the file when the expiration time is reached. If a fetched file has a NetworkLinkControl,
 *             the `<expires>` time takes precedence over expiration times specified in HTTP headers. If no `<expires>`
 *             time is specified, the HTTP max-age header is used (if present). If max-age is not present, the Expires
 *             HTTP header is used (if present).
 *
 * @enum {string}
 */
const RefreshMode = {
  CHANGE: 'onChange',
  EXPIRE: 'onExpire',
  INTERVAL: 'onInterval'
};

/**
 * View refresh modes for KML links.
 *
 * From the KML spec:
 * never:     (default) Ignore changes in the view. Also ignore `<viewFormat>` parameters, if any.
 * onStop:    Refresh the file n seconds after movement stops, where n is specified in `<viewRefreshTime>`.
 * onRequest: Refresh the file only when the user explicitly requests it. (For example, in Google Earth, the user
 *            right-clicks and selects Refresh in the Context menu.)
 * onRegion:  Refresh the file when the Region becomes active.
 *
 * @enum {string}
 */
const ViewRefreshMode = {
  NEVER: 'never',
  REGION: 'onRegion',
  REQUEST: 'onRequest',
  STOP: 'onStop'
};

/**
 * @enum {string}
 */
const ElementType = {
  FOLDER: 'Folder',
  PLACEMARK: 'Placemark',
  NETWORK_LINK: 'NetworkLink'
};

/**
 * Style type enumeration for KML.
 * @enum {string}
 */
const StyleType = {
  DEFAULT: 'default',
  ICON: 'icon',
  POINT: 'point'
};

/**
 * @typedef {{
 *   href: string,
 *   scale: (number|undefined)
 * }}
 */
let Icon;

/**
 * Google Earth icon URL prefix.
 * @type {string}
 */
const GOOGLE_EARTH_URL = 'https://maps.google.com/mapfiles/kml/';

/**
 * Path to KML icons.
 * @type {string}
 */
const ICON_PATH = ROOT + 'images/icons/kml/';

/**
 * Google Earth icons.
 * @enum {string}
 */
const GoogleEarthIcons = {
  NUM_01: 'paddle/1.png',
  NUM_02: 'paddle/2.png',
  NUM_03: 'paddle/3.png',
  NUM_04: 'paddle/4.png',
  NUM_05: 'paddle/5.png',
  NUM_06: 'paddle/6.png',
  NUM_07: 'paddle/7.png',
  NUM_08: 'paddle/8.png',
  NUM_09: 'paddle/9.png',
  NUM_10: 'paddle/10.png',
  A: 'paddle/a.png',
  B: 'paddle/b.png',
  C: 'paddle/c.png',
  D: 'paddle/d.png',
  E: 'paddle/e.png',
  F: 'paddle/f.png',
  G: 'paddle/g.png',
  H: 'paddle/h.png',
  I: 'paddle/i.png',
  J: 'paddle/j.png',
  K: 'paddle/k.png',
  L: 'paddle/l.png',
  M: 'paddle/m.png',
  N: 'paddle/n.png',
  O: 'paddle/o.png',
  P: 'paddle/p.png',
  Q: 'paddle/q.png',
  R: 'paddle/r.png',
  S: 'paddle/s.png',
  T: 'paddle/t.png',
  U: 'paddle/u.png',
  V: 'paddle/v.png',
  W: 'paddle/w.png',
  X: 'paddle/x.png',
  Y: 'paddle/y.png',
  Z: 'paddle/z.png',
  BLU_BLANK: 'paddle/blu-blank.png',
  BLU_CIRCLE: 'paddle/blu-circle.png',
  BLU_DIAMOND: 'paddle/blu-diamond.png',
  BLUE_PUSHPIN: 'pushpin/blue-pushpin.png',
  BLU_SQUARE: 'paddle/blu-square.png',
  BLU_STARS: 'paddle/blu-stars.png',
  GRN_BLANK: 'paddle/grn-blank.png',
  GRN_CIRCLE: 'paddle/grn-circle.png',
  GRN_DIAMOND: 'paddle/grn-diamond.png',
  GRN_PUSHPIN: 'pushpin/grn-pushpin.png',
  GRN_SQUARE: 'paddle/grn-square.png',
  GRN_STARS: 'paddle/grn-stars.png',
  LTBLU_BLANK: 'paddle/ltblu-blank.png',
  LTBLU_CIRCLE: 'paddle/ltblu-circle.png',
  LTBLU_DIAMOND: 'paddle/ltblu-diamond.png',
  LTBLU_PUSHPIN: 'pushpin/ltblu-pushpin.png',
  LTBLU_SQUARE: 'paddle/ltblu-square.png',
  LTBLU_STARS: 'paddle/ltblu-stars.png',
  PINK_BLANK: 'paddle/pink-blank.png',
  PINK_CIRCLE: 'paddle/pink-circle.png',
  PINK_DIAMOND: 'paddle/pink-diamond.png',
  PINK_PUSHPIN: 'pushpin/pink-pushpin.png',
  PINK_SQUARE: 'paddle/pink-square.png',
  PINK_STARS: 'paddle/pink-stars.png',
  PURPLE_CIRCLE: 'paddle/purple-circle.png',
  PURPLE_DIAMOND: 'paddle/purple-diamond.png',
  PURPLE_PUSHPIN: 'pushpin/purple-pushpin.png',
  PURPLE_SQUARE: 'paddle/purple-square.png',
  PURPLE_STARS: 'paddle/purple-stars.png',
  RED_CIRCLE: 'paddle/red-circle.png',
  RED_DIAMOND: 'paddle/red-diamond.png',
  RED_PUSHPIN: 'pushpin/red-pushpin.png',
  RED_SQUARE: 'paddle/red-square.png',
  RED_STARS: 'paddle/red-stars.png',
  WHT_BLANK: 'paddle/wht-blank.png',
  WHT_CIRCLE: 'paddle/wht-circle.png',
  WHT_DIAMOND: 'paddle/wht-diamond.png',
  WHT_PUSHPIN: 'pushpin/wht-pushpin.png',
  WHT_SQUARE: 'paddle/wht-square.png',
  WHT_STARS: 'paddle/wht-stars.png',
  YLW_CIRCLE: 'paddle/ylw-circle.png',
  YLW_DIAMOND: 'paddle/ylw-diamond.png',
  YLW_PUSHPIN: 'pushpin/ylw-pushpin.png',
  YLW_SQUARE: 'paddle/ylw-square.png',
  YLW_STARS: 'paddle/ylw-stars.png',
  AIRPORTS: 'shapes/airports.png',
  AIRPORTS_WHITE: 'shapes/airports_white.png',
  ARROW_REVERSE: 'shapes/arrow-reverse.png',
  ARROW: 'shapes/arrow.png',
  ARTS: 'shapes/arts.png',
  BARS: 'shapes/bars.png',
  BUS: 'shapes/bus.png',
  CABS: 'shapes/cabs.png',
  CAMERA: 'shapes/camera.png',
  CAMPFIRE: 'shapes/campfire.png',
  CAMPGROUND: 'shapes/campground.png',
  CAUTION: 'shapes/caution.png',
  COFFEE: 'shapes/coffee.png',
  CONVENIENCE: 'shapes/convenience.png',
  CROSSHAIRS: 'shapes/cross-hairs.png',
  CYCLING: 'shapes/cycling.png',
  DINING: 'shapes/dining.png',
  DOLLAR: 'shapes/dollar.png',
  DONUT: 'shapes/donut.png',
  EARTHQUAKE: 'shapes/earthquake.png',
  ELECTRONICS: 'shapes/electronics.png',
  EURO: 'shapes/euro.png',
  FALLING_ROCKS: 'shapes/falling_rocks.png',
  FERRY: 'shapes/ferry.png',
  FIREDEPT: 'shapes/firedept.png',
  FISHING: 'shapes/fishing.png',
  FLAG: 'shapes/flag.png',
  FORBIDDEN: 'shapes/forbidden.png',
  GAS_STATIONS: 'shapes/gas_stations.png',
  GOLF: 'shapes/golf.png',
  GROCERY: 'shapes/grocery.png',
  HELIPORT: 'shapes/heliport.png',
  HIKER: 'shapes/hiker.png',
  HOMEGARDENBUSINESS: 'shapes/homegardenbusiness.png',
  HORSEBACKRIDING: 'shapes/horsebackriding.png',
  HOSPITALS: 'shapes/hospitals.png',
  INFO_CIRCLE: 'shapes/info_circle.png',
  INFO_I: 'shapes/info-i.png',
  INFO: 'shapes/info.png',
  LODGING: 'shapes/lodging.png',
  MAN: 'shapes/man.png',
  MARINA: 'shapes/marina.png',
  MECHANIC: 'shapes/mechanic.png',
  MOTORCYCLING: 'shapes/motorcycling.png',
  MOVIES: 'shapes/movies.png',
  OPEN_DIAMOND: 'shapes/open-diamond.png',
  PARKING_LOT: 'shapes/parking_lot.png',
  PARKS: 'shapes/parks.png',
  PARTLY_CLOUDY: 'shapes/partly_cloudy.png',
  PHONE: 'shapes/phone.png',
  PICNIC: 'shapes/picnic.png',
  PLACEMARK_CIRCLE: 'shapes/placemark_circle.png',
  PLACEMARK_SQUARE: 'shapes/placemark_square.png',
  PLAY: 'shapes/play.png',
  POI: 'shapes/poi.png',
  POLICE: 'shapes/police.png',
  POLYGON: 'shapes/polygon.png',
  POST_OFFICE: 'shapes/post_office.png',
  RAIL: 'shapes/rail.png',
  RAINY: 'shapes/rainy.png',
  RANGER_STATION: 'shapes/ranger_station.png',
  REALESTATE: 'shapes/realestate.png',
  SAILING: 'shapes/sailing.png',
  SALON: 'shapes/salon.png',
  SHADED_DOT: 'shapes/shaded_dot.png',
  SHOPPING: 'shapes/shopping.png',
  SKI: 'shapes/ski.png',
  SNACK_BAR: 'shapes/snack_bar.png',
  SNOWFLAKE_SIMPLE: 'shapes/snowflake_simple.png',
  SQUARE: 'shapes/square.png',
  STAR: 'shapes/star.png',
  SUBWAY: 'shapes/subway.png',
  SUNNY: 'shapes/sunny.png',
  SWIMMING: 'shapes/swimming.png',
  TARGET: 'shapes/target.png',
  TOILETS: 'shapes/toilets.png',
  TRAIL: 'shapes/trail.png',
  TRAM: 'shapes/tram.png',
  TRIANGLE: 'shapes/triangle.png',
  TRUCK: 'shapes/truck.png',
  VOLCANO: 'shapes/volcano.png',
  WATER: 'shapes/water.png',
  WEBCAM: 'shapes/webcam.png',
  WHEEL_CHAIR_ACCESSIBLE: 'shapes/wheel_chair_accessible.png',
  WOMAN: 'shapes/woman.png',
  YEN: 'shapes/yen.png'
};

/**
 * The default icon path (white circle).
 * @type {string}
 */
const DEFAULT_ICON_PATH = GOOGLE_EARTH_URL + GoogleEarthIcons.PLACEMARK_CIRCLE;

/**
 * The default icon title (white circle).
 * @type {string}
 */
const DEFAULT_ICON_TITLE = 'PLACEMARK_CIRCLE';

/**
 * The default icon options (white circle).
 * @type {Object|undefined}
 */
const DEFAULT_ICON_OPTIONS = undefined;

/**
 * The default icon to use for KML placemarks.
 * @type {Icon}
 */
const DEFAULT_ICON = {
  href: DEFAULT_ICON_PATH,
  options: DEFAULT_ICON_OPTIONS,
  scale: 1
};

/**
 * @type {RegExp}
 */
const GMAPS_SEARCH = /^(https?:)?\/\/maps\.google\.com\/mapfiles\/kml\//i;

/**
 * Get the default icon object.
 *
 * @return {!osx.icon.Icon} The default icon.
 */
const getDefaultIcon = function() {
  return /** @type {!osx.icon.Icon} */ ({
    title: DEFAULT_ICON_TITLE,
    path: DEFAULT_ICON_PATH,
    options: DEFAULT_ICON_OPTIONS
  });
};

/**
 * @type {boolean}
 */
const isGoogleMapsAccessible = true;

/**
 * Full URL to the kml icons that can be exported in reports, etc. Override by setting "plugin.file.kml.icon.mirror"
 * @type {string}
 */
const mirror = window.location.origin + window.location.pathname + 'images/icons/kml/';

/**
 * Replace the Google icon URI with the application image path.
 * @param {string|null|undefined} src The image source URL.
 * @return {!string} The icon src.
 */
const replaceGoogleUri = function(src) {
  if (GMAPS_SEARCH.test(src)) {
    const secureSource = 'https:' + src.replace(/^[a-z]*:\/\//, '//');
    const icon = GOOGLE_EARTH_ICON_SET.find((icon) => secureSource === icon.path);
    if (icon) {
      return icon.path.replace(GMAPS_SEARCH, ICON_PATH);
    } else if (!isGoogleMapsAccessible) {
      return DEFAULT_ICON_PATH;
    }
  }

  return src || '';
};

/**
 * Replace our mirrored source URL with with the application image path.
 * It doesn't really make sense to treat it as an external URL, does it?
 * @param {string|null|undefined} src The image source URL.
 * @return {!string} The icon src.
 */
const replaceExportableUri = function(src) {
  return src.replace(mirror, ICON_PATH);
};

/**
 * Replace the Google icon URL with the non-relative image URL.
 *
 * @param {string|null|undefined} src The image source URL.
 * @return {!string} The icon src.
 */
const exportableIconUri = (function() {
  /**
   * Helper object to speed up src to exportable translations
   * @type {Object<string, string>}
   */
  const lookup = {};

  return (src) => {
    if (!isGoogleMapsAccessible && // fastest test
        !lookup[src] &&
        GMAPS_SEARCH.test(src)) { // slowest test
      let converted = null;

      const secureSource = 'https:' + src.replace(/^[a-z]*:\/\//, '//');
      const icon = GOOGLE_EARTH_ICON_SET.find((icon) => secureSource === icon.path);

      if (icon) {
        converted = icon.path.replace(GMAPS_SEARCH, mirror);
      } else {
        converted = DEFAULT_ICON_PATH.replace(GMAPS_SEARCH, mirror);
      }

      lookup[src] = converted; // save to prevent re-work
    }
    return lookup[src] || src || '';
  };
})();

/**
 * The Google Earth icon set, ordered to match Google Earth.
 * @type {!Array<!osx.icon.Icon>}
 */
const GOOGLE_EARTH_ICON_SET = [
  // push pins
  {
    title: 'Yellow Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YLW_PUSHPIN
  },
  {
    title: 'Blue Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLUE_PUSHPIN
  },
  {
    title: 'Green Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_PUSHPIN
  },
  {
    title: 'Light Blue Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_PUSHPIN
  },
  {
    title: 'Pink Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_PUSHPIN
  },
  {
    title: 'Purple Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PURPLE_PUSHPIN
  },
  {
    title: 'Red Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RED_PUSHPIN
  },
  {
    title: 'White Push Pin',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_PUSHPIN
  },

  // alphabet
  {
    title: 'Letter A',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.A
  },
  {
    title: 'Letter B',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.B
  },
  {
    title: 'Letter C',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.C
  },
  {
    title: 'Letter D',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.D
  },
  {
    title: 'Letter E',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.E
  },
  {
    title: 'Letter F',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.F
  },
  {
    title: 'Letter G',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.G
  },
  {
    title: 'Letter H',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.H
  },
  {
    title: 'Letter I',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.I
  },
  {
    title: 'Letter J',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.J
  },
  {
    title: 'Letter K',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.K
  },
  {
    title: 'Letter L',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.L
  },
  {
    title: 'Letter M',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.M
  },
  {
    title: 'Letter N',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.N
  },
  {
    title: 'Letter O',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.O
  },
  {
    title: 'Letter P',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.P
  },
  {
    title: 'Letter Q',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.Q
  },
  {
    title: 'Letter R',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.R
  },
  {
    title: 'Letter S',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.S
  },
  {
    title: 'Letter T',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.T
  },
  {
    title: 'Letter U',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.U
  },
  {
    title: 'Letter V',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.V
  },
  {
    title: 'Letter W',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.W
  },
  {
    title: 'Letter X',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.X
  },
  {
    title: 'Letter Y',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.Y
  },
  {
    title: 'Letter Z',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.Z
  },

  // numbers
  {
    title: 'Number 1',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_01
  },
  {
    title: 'Number 2',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_02
  },
  {
    title: 'Number 3',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_03
  },
  {
    title: 'Number 4',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_04
  },
  {
    title: 'Number 5',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_05
  },
  {
    title: 'Number 6',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_06
  },
  {
    title: 'Number 7',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_07
  },
  {
    title: 'Number 8',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_08
  },
  {
    title: 'Number 9',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_09
  },
  {
    title: 'Number 10',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.NUM_10
  },

  // colored paddles
  {
    title: 'Blue Blank',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLU_BLANK
  },
  {
    title: 'Blue Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLU_DIAMOND
  },
  {
    title: 'Blue Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLU_CIRCLE
  },
  {
    title: 'Blue Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLU_SQUARE
  },
  {
    title: 'Blue Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BLU_STARS
  },
  {
    title: 'Green Blank',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_BLANK
  },
  {
    title: 'Green Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_DIAMOND
  },
  {
    title: 'Green Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_CIRCLE
  },
  {
    title: 'Green Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_SQUARE
  },
  {
    title: 'Green Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GRN_STARS
  },
  {
    title: 'Light Blue Blank',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_BLANK
  },
  {
    title: 'Light Blue Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_DIAMOND
  },
  {
    title: 'Light Blue Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_CIRCLE
  },
  {
    title: 'Light Blue Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_SQUARE
  },
  {
    title: 'Light Blue Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LTBLU_STARS
  },
  {
    title: 'Pink Blank',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_BLANK
  },
  {
    title: 'Pink Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_DIAMOND
  },
  {
    title: 'Pink Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_CIRCLE
  },
  {
    title: 'Pink Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_SQUARE
  },
  {
    title: 'Pink Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PINK_STARS
  },
  {
    title: 'Yellow Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YLW_DIAMOND
  },
  {
    title: 'Yellow Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YLW_CIRCLE
  },
  {
    title: 'Yellow Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YLW_SQUARE
  },
  {
    title: 'Yellow Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YLW_STARS
  },
  {
    title: 'White Blank',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_BLANK
  },
  {
    title: 'White Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_DIAMOND
  },
  {
    title: 'White Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_CIRCLE
  },
  {
    title: 'White Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_SQUARE
  },
  {
    title: 'White Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_STARS
  },
  {
    title: 'Red Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RED_DIAMOND
  },
  {
    title: 'Red Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RED_CIRCLE
  },
  {
    title: 'Red Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RED_SQUARE
  },
  {
    title: 'Red Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RED_STARS
  },
  {
    title: 'Purple Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PURPLE_DIAMOND
  },
  {
    title: 'Purple Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PURPLE_CIRCLE
  },
  {
    title: 'Purple Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PURPLE_SQUARE
  },
  {
    title: 'Purple Stars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PURPLE_STARS
  },

  // white icons
  {
    title: 'Arrow Reverse',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.ARROW_REVERSE
  },
  {
    title: 'Arrow',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.ARROW
  },
  {
    title: 'Donut',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.DONUT
  },
  {
    title: 'Forbidden',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FORBIDDEN
  },
  {
    title: 'Info I',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.INFO_I
  },
  {
    title: 'Polygon',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.POLYGON
  },
  {
    title: 'Diamond',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.OPEN_DIAMOND
  },
  {
    title: 'Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SQUARE
  },
  {
    title: 'Star',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.STAR
  },
  {
    title: 'Target',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TARGET
  },
  {
    title: 'Triangle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TRIANGLE
  },
  {
    title: 'Crosshairs',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CROSSHAIRS
  },
  {
    title: 'Square',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PLACEMARK_SQUARE
  },
  {
    title: 'Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PLACEMARK_CIRCLE
  },
  {
    title: 'Shaded Dot',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SHADED_DOT
  },
  {
    title: 'Airports White',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.AIRPORTS_WHITE
  },

  // light blue icons
  {
    title: 'Dining',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.DINING
  },
  {
    title: 'Coffee',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.COFFEE
  },
  {
    title: 'Bars',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BARS
  },
  {
    title: 'Snack Bar',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SNACK_BAR
  },
  {
    title: 'Man',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.MAN
  },
  {
    title: 'Woman',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WOMAN
  },
  {
    title: 'Wheel Chair Accessible',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WHEEL_CHAIR_ACCESSIBLE
  },

  // dark blue icons
  {
    title: 'Parking Lot',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PARKING_LOT
  },
  {
    title: 'Cabs',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CABS
  },
  {
    title: 'Bus',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.BUS
  },
  {
    title: 'Truck',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TRUCK
  },
  {
    title: 'Rail',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RAIL
  },
  {
    title: 'Airports',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.AIRPORTS
  },
  {
    title: 'Ferry',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FERRY
  },
  {
    title: 'Heliport',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.HELIPORT
  },
  {
    title: 'Subway',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SUBWAY
  },
  {
    title: 'Tram',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TRAM
  },

  // blue icons
  {
    title: 'Info',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.INFO
  },
  {
    title: 'Circle',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.INFO_CIRCLE
  },
  {
    title: 'Flag',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FLAG
  },
  {
    title: 'Rainy',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RAINY
  },
  {
    title: 'Water',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WATER
  },
  {
    title: 'Snowflake Simple',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SNOWFLAKE_SIMPLE
  },
  {
    title: 'Marina',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.MARINA
  },
  {
    title: 'Fishing',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FISHING
  },
  {
    title: 'Sailing',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SAILING
  },
  {
    title: 'Swimming',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SWIMMING
  },
  {
    title: 'Ski',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SKI
  },

  // green icons
  {
    title: 'Parks',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PARKS
  },
  {
    title: 'Campfire',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CAMPFIRE
  },
  {
    title: 'Picnic',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PICNIC
  },
  {
    title: 'Campground',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CAMPGROUND
  },
  {
    title: 'Ranger Station',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.RANGER_STATION
  },
  {
    title: 'Toilets',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TOILETS
  },
  {
    title: 'Poi',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.POI
  },
  {
    title: 'Hiker',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.HIKER
  },
  {
    title: 'Cycling',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CYCLING
  },
  {
    title: 'Motorcycling',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.MOTORCYCLING
  },
  {
    title: 'Horseback Riding',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.HORSEBACKRIDING
  },
  {
    title: 'Play',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PLAY
  },
  {
    title: 'Golf',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GOLF
  },
  {
    title: 'Trail',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.TRAIL
  },

  // yellow icons
  {
    title: 'Shopping',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SHOPPING
  },
  {
    title: 'Movies',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.MOVIES
  },
  {
    title: 'Convenience',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CONVENIENCE
  },
  {
    title: 'Grocery',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GROCERY
  },
  {
    title: 'Arts',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.ARTS
  },
  {
    title: 'Home Garden Business',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.HOMEGARDENBUSINESS
  },
  {
    title: 'Electronics',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.ELECTRONICS
  },
  {
    title: 'Mechanic',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.MECHANIC
  },
  {
    title: 'Gas Stations',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.GAS_STATIONS
  },
  {
    title: 'Real Estate',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.REALESTATE
  },
  {
    title: 'Salon',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SALON
  },
  {
    title: 'Dollar',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.DOLLAR
  },
  {
    title: 'Euro',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.EURO
  },
  {
    title: 'Yen',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.YEN
  },

  // red icons
  {
    title: 'Firedept',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FIREDEPT
  },
  {
    title: 'Hospitals',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.HOSPITALS
  },
  {
    title: 'Lodging',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.LODGING
  },
  {
    title: 'Phone',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PHONE
  },
  {
    title: 'Caution',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CAUTION
  },
  {
    title: 'Earthquake',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.EARTHQUAKE
  },
  {
    title: 'Falling Rocks',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.FALLING_ROCKS
  },

  // orange icons
  {
    title: 'Post Office',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.POST_OFFICE
  },
  {
    title: 'Police',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.POLICE
  },
  {
    title: 'Sunny',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.SUNNY
  },
  {
    title: 'Partly Cloudy',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.PARTLY_CLOUDY
  },
  {
    title: 'Volcano',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.VOLCANO
  },

  // purple icons
  {
    title: 'Camera',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.CAMERA
  },
  {
    title: 'Webcam',
    path: GOOGLE_EARTH_URL + GoogleEarthIcons.WEBCAM
  }
];

exports = {
  RefreshMode,
  ViewRefreshMode,
  ElementType,
  StyleType,
  GOOGLE_EARTH_URL,
  ICON_PATH,
  GoogleEarthIcons,
  DEFAULT_ICON_PATH,
  DEFAULT_ICON_TITLE,
  DEFAULT_ICON_OPTIONS,
  DEFAULT_ICON,
  GMAPS_SEARCH,
  getDefaultIcon,
  isGoogleMapsAccessible,
  mirror,
  replaceGoogleUri,
  replaceExportableUri,
  exportableIconUri,
  GOOGLE_EARTH_ICON_SET,
  Icon
};
