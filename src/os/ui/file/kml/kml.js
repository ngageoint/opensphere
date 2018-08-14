goog.provide('os.ui.file.kml');


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
os.ui.file.kml.RefreshMode = {
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
os.ui.file.kml.ViewRefreshMode = {
  NEVER: 'never',
  REGION: 'onRegion',
  REQUEST: 'onRequest',
  STOP: 'onStop'
};


/**
 * @enum {string}
 */
os.ui.file.kml.ElementType = {
  FOLDER: 'Folder',
  PLACEMARK: 'Placemark',
  NETWORK_LINK: 'NetworkLink'
};


/**
 * Style type enumeration for KML.
 * @enum {string}
 */
os.ui.file.kml.StyleType = {
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
os.ui.file.kml.Icon;


/**
 * Google Earth icon URL prefix.
 * @type {string}
 * @const
 */
os.ui.file.kml.GOOGLE_EARTH_URL = 'http://maps.google.com/mapfiles/kml/';


/**
 * Path to KML icons.
 * @type {string}
 * @const
 */
os.ui.file.kml.ICON_PATH = os.ROOT + 'images/icons/kml/';


/**
 * Google Earth icons.
 * @enum {string}
 */
os.ui.file.kml.GoogleEarthIcons = {
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
 * The default icon (white circle).
 * @type {string}
 */
os.ui.file.kml.DEFAULT_ICON_PATH =
    os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE;


/**
 * The default icon to use for KML placemarks.
 * @type {os.ui.file.kml.Icon}
 * @const
 */
os.ui.file.kml.DEFAULT_ICON = {
  href: os.ui.file.kml.DEFAULT_ICON_PATH,
  scale: 1
};


/**
 * @type {RegExp}
 * @const
 */
os.ui.file.kml.GMAPS_SEARCH = /https?:\/\/maps\.google\.com\/mapfiles\/kml\//i;


/**
 * Get the default icon object.
 * @return {!osx.icon.Icon} The default icon.
 */
os.ui.file.kml.getDefaultIcon = function() {
  return /** @type {!osx.icon.Icon} */ ({
    path: os.ui.file.kml.DEFAULT_ICON_PATH
  });
};


/**
 * Replace the Google icon URI with the application image path.
 * @param {string|null|undefined} src The image source URL.
 * @return {string} The icon src.
 */
os.ui.file.kml.replaceGoogleUri = function(src) {
  return src ? src.replace(os.ui.file.kml.GMAPS_SEARCH, os.ui.file.kml.ICON_PATH) : '';
};


/**
 * The Google Earth icon set, ordered to match Google Earth.
 * @type {!Array<!osx.icon.Icon>}
 * @const
 */
os.ui.file.kml.GOOGLE_EARTH_ICON_SET = [
  // push pins
  {
    title: 'Yellow Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YLW_PUSHPIN
  },
  {
    title: 'Blue Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLUE_PUSHPIN
  },
  {
    title: 'Green Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_PUSHPIN
  },
  {
    title: 'Light Blue Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_PUSHPIN
  },
  {
    title: 'Pink Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_PUSHPIN
  },
  {
    title: 'Purple Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PURPLE_PUSHPIN
  },
  {
    title: 'Red Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RED_PUSHPIN
  },
  {
    title: 'White Push Pin',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_PUSHPIN
  },

  // alphabet
  {
    title: 'Letter A',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.A
  },
  {
    title: 'Letter B',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.B
  },
  {
    title: 'Letter C',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.C
  },
  {
    title: 'Letter D',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.D
  },
  {
    title: 'Letter E',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.E
  },
  {
    title: 'Letter F',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.F
  },
  {
    title: 'Letter G',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.G
  },
  {
    title: 'Letter H',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.H
  },
  {
    title: 'Letter I',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.I
  },
  {
    title: 'Letter J',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.J
  },
  {
    title: 'Letter K',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.K
  },
  {
    title: 'Letter L',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.L
  },
  {
    title: 'Letter M',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.M
  },
  {
    title: 'Letter N',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.N
  },
  {
    title: 'Letter O',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.O
  },
  {
    title: 'Letter P',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.P
  },
  {
    title: 'Letter Q',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.Q
  },
  {
    title: 'Letter R',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.R
  },
  {
    title: 'Letter S',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.S
  },
  {
    title: 'Letter T',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.T
  },
  {
    title: 'Letter U',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.U
  },
  {
    title: 'Letter V',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.V
  },
  {
    title: 'Letter W',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.W
  },
  {
    title: 'Letter X',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.X
  },
  {
    title: 'Letter Y',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.Y
  },
  {
    title: 'Letter Z',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.Z
  },

  // numbers
  {
    title: 'Number 1',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_01
  },
  {
    title: 'Number 2',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_02
  },
  {
    title: 'Number 3',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_03
  },
  {
    title: 'Number 4',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_04
  },
  {
    title: 'Number 5',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_05
  },
  {
    title: 'Number 6',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_06
  },
  {
    title: 'Number 7',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_07
  },
  {
    title: 'Number 8',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_08
  },
  {
    title: 'Number 9',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_09
  },
  {
    title: 'Number 10',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.NUM_10
  },

  // colored paddles
  {
    title: 'Blue Blank',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLU_BLANK
  },
  {
    title: 'Blue Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLU_DIAMOND
  },
  {
    title: 'Blue Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLU_CIRCLE
  },
  {
    title: 'Blue Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLU_SQUARE
  },
  {
    title: 'Blue Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BLU_STARS
  },
  {
    title: 'Green Blank',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_BLANK
  },
  {
    title: 'Green Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_DIAMOND
  },
  {
    title: 'Green Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_CIRCLE
  },
  {
    title: 'Green Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_SQUARE
  },
  {
    title: 'Green Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GRN_STARS
  },
  {
    title: 'Light Blue Blank',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_BLANK
  },
  {
    title: 'Light Blue Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_DIAMOND
  },
  {
    title: 'Light Blue Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_CIRCLE
  },
  {
    title: 'Light Blue Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_SQUARE
  },
  {
    title: 'Light Blue Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LTBLU_STARS
  },
  {
    title: 'Pink Blank',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_BLANK
  },
  {
    title: 'Pink Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_DIAMOND
  },
  {
    title: 'Pink Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_CIRCLE
  },
  {
    title: 'Pink Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_SQUARE
  },
  {
    title: 'Pink Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PINK_STARS
  },
  {
    title: 'Yellow Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YLW_DIAMOND
  },
  {
    title: 'Yellow Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YLW_CIRCLE
  },
  {
    title: 'Yellow Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YLW_SQUARE
  },
  {
    title: 'Yellow Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YLW_STARS
  },
  {
    title: 'White Blank',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_BLANK
  },
  {
    title: 'White Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_DIAMOND
  },
  {
    title: 'White Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_CIRCLE
  },
  {
    title: 'White Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_SQUARE
  },
  {
    title: 'White Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_STARS
  },
  {
    title: 'Red Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RED_DIAMOND
  },
  {
    title: 'Red Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RED_CIRCLE
  },
  {
    title: 'Red Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RED_SQUARE
  },
  {
    title: 'Red Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RED_STARS
  },
  {
    title: 'Purple Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PURPLE_DIAMOND
  },
  {
    title: 'Purple Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PURPLE_CIRCLE
  },
  {
    title: 'Purple Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PURPLE_SQUARE
  },
  {
    title: 'Purple Stars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PURPLE_STARS
  },

  // white icons
  {
    title: 'Arrow Reverse',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.ARROW_REVERSE
  },
  {
    title: 'Arrow',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.ARROW
  },
  {
    title: 'Donut',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.DONUT
  },
  {
    title: 'Forbidden',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FORBIDDEN
  },
  {
    title: 'Info I',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.INFO_I
  },
  {
    title: 'Polygon',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.POLYGON
  },
  {
    title: 'Diamond',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.OPEN_DIAMOND
  },
  {
    title: 'Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SQUARE
  },
  {
    title: 'Star',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.STAR
  },
  {
    title: 'Target',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TARGET
  },
  {
    title: 'Triangle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TRIANGLE
  },
  {
    title: 'Crosshairs',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CROSSHAIRS
  },
  {
    title: 'Square',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_SQUARE
  },
  {
    title: 'Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE
  },
  {
    title: 'Shaded Dot',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SHADED_DOT
  },

  // light blue icons
  {
    title: 'Dining',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.DINING
  },
  {
    title: 'Coffee',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.COFFEE
  },
  {
    title: 'Bars',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BARS
  },
  {
    title: 'Snack Bar',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SNACK_BAR
  },
  {
    title: 'Man',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.MAN
  },
  {
    title: 'Woman',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WOMAN
  },
  {
    title: 'Wheel Chair Accessible',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHEEL_CHAIR_ACCESSIBLE
  },

  // dark blue icons
  {
    title: 'Parking Lot',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PARKING_LOT
  },
  {
    title: 'Cabs',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CABS
  },
  {
    title: 'Bus',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.BUS
  },
  {
    title: 'Truck',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TRUCK
  },
  {
    title: 'Rail',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RAIL
  },
  {
    title: 'Airports',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.AIRPORTS
  },
  {
    title: 'Ferry',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FERRY
  },
  {
    title: 'Heliport',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.HELIPORT
  },
  {
    title: 'Subway',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SUBWAY
  },
  {
    title: 'Tram',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TRAM
  },

  // blue icons
  {
    title: 'Info',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.INFO
  },
  {
    title: 'Circle',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.INFO_CIRCLE
  },
  {
    title: 'Flag',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FLAG
  },
  {
    title: 'Rainy',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RAINY
  },
  {
    title: 'Water',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WATER
  },
  {
    title: 'Snowflake Simple',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SNOWFLAKE_SIMPLE
  },
  {
    title: 'Marina',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.MARINA
  },
  {
    title: 'Fishing',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FISHING
  },
  {
    title: 'Sailing',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SAILING
  },
  {
    title: 'Swimming',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SWIMMING
  },
  {
    title: 'Ski',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SKI
  },

  // green icons
  {
    title: 'Parks',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PARKS
  },
  {
    title: 'Campfire',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CAMPFIRE
  },
  {
    title: 'Picnic',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PICNIC
  },
  {
    title: 'Campground',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CAMPGROUND
  },
  {
    title: 'Ranger Station',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.RANGER_STATION
  },
  {
    title: 'Toilets',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TOILETS
  },
  {
    title: 'Poi',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.POI
  },
  {
    title: 'Hiker',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.HIKER
  },
  {
    title: 'Cycling',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CYCLING
  },
  {
    title: 'Motorcycling',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.MOTORCYCLING
  },
  {
    title: 'Horseback Riding',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.HORSEBACKRIDING
  },
  {
    title: 'Play',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLAY
  },
  {
    title: 'Golf',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GOLF
  },
  {
    title: 'Trail',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.TRAIL
  },

  // yellow icons
  {
    title: 'Shopping',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SHOPPING
  },
  {
    title: 'Movies',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.MOVIES
  },
  {
    title: 'Convenience',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CONVENIENCE
  },
  {
    title: 'Grocery',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GROCERY
  },
  {
    title: 'Arts',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.ARTS
  },
  {
    title: 'Home Garden Business',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.HOMEGARDENBUSINESS
  },
  {
    title: 'Electronics',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.ELECTRONICS
  },
  {
    title: 'Mechanic',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.MECHANIC
  },
  {
    title: 'Gas Stations',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.GAS_STATIONS
  },
  {
    title: 'Real Estate',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.REALESTATE
  },
  {
    title: 'Salon',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SALON
  },
  {
    title: 'Dollar',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.DOLLAR
  },
  {
    title: 'Euro',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.EURO
  },
  {
    title: 'Yen',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.YEN
  },

  // red icons
  {
    title: 'Firedept',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FIREDEPT
  },
  {
    title: 'Hospitals',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.HOSPITALS
  },
  {
    title: 'Lodging',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.LODGING
  },
  {
    title: 'Phone',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PHONE
  },
  {
    title: 'Caution',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CAUTION
  },
  {
    title: 'Earthquake',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.EARTHQUAKE
  },
  {
    title: 'Falling Rocks',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.FALLING_ROCKS
  },

  // orange icons
  {
    title: 'Post Office',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.POST_OFFICE
  },
  {
    title: 'Police',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.POLICE
  },
  {
    title: 'Sunny',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.SUNNY
  },
  {
    title: 'Partly Cloudy',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PARTLY_CLOUDY
  },
  {
    title: 'Volcano',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.VOLCANO
  },

  // purple icons
  {
    title: 'Camera',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.CAMERA
  },
  {
    title: 'Webcam',
    path: os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WEBCAM
  }
];
