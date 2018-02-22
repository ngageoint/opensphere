/* eslint-disable */
/**
 * @externs
 * @see http://cesium.agi.com/
 */
var Cesium = {};


/**
 * @param {T|undefined} value
 * @param {T} defaultValue
 * @return {T}
 * @template T
 */
Cesium.defaultValue = function(value, defaultValue) {};


/**
 * @param {*} value
 * @return {boolean}
 */
Cesium.defined = function(value) {};



/**
 * @constructor
 */
Cesium.Promise = function() {};


/**
 * @type {Object}
 */
Cesium.TrustedServers = {};


/**
 * @param {string} host The host/domain
 * @param {number} port The port number
 */
Cesium.TrustedServers.add = function(host, port) {};


/**
 * @param {string} host The host/domain
 * @param {number} port The port number
 */
Cesium.TrustedServers.remove = function(host, port) {};


/**
 * @param {string} uri The uri to check
 * @return {boolean} Whether or not the URL is trusted
 */
Cesium.TrustedServers.contains = function(uri) {};


/**
 * Clears trusted servers
 */
Cesium.TrustedServers.clear = function() {};


/**
 * @constructor
 */
Cesium.Deferred = function() {};


/**
 * Resolver for a deferred.
 * @param {T} value
 * @template T
 */
Cesium.Deferred.prototype.resolve = function(value) {};


/**
 * @type {Cesium.Promise}
 */
Cesium.Deferred.prototype.promise;


/**
 * @typedef {{
 *   url: (string|undefined),
 *   priority: (number|undefined),
 *   throttle: (boolean|undefined),
 *   throttleByServer: (boolean|undefined)
 * }}
 */
Cesium.RequestOptions;


/**
 * @param {Cesium.RequestOptions=} opt_options
 * @constructor
 */
Cesium.Request = function(opt_options) {};


/**
 * @param {string|Cesium.Promise} url
 * @param {Object=} opt_headers
 * @param {Cesium.Request=} opt_request
 * @return {Cesium.Promise|undefined}
 */
Cesium.loadArrayBuffer = function(url, opt_headers, opt_request) {};


/**
 * @param {*} promiseOrValue
 * @param {Function=} opt_onFulfilled
 * @param {Function=} opt_onRejected
 * @param {Function=} opt_onProgress
 * @return {T}
 * @template T
 */
Cesium.when = function(promiseOrValue, opt_onFulfilled, opt_onRejected, opt_onProgress) {};


/**
 * Gets a new Cesium.Deferred.
 * @return {Cesium.Deferred}
 */
Cesium.when.defer = function() {};



/**
 * Prevent using a removed API.
 * @constructor
 */
Cesium.RemovedAPI = function() {};


/**
 * @enum {number}
 */
Cesium.BlendOption = {
  OPAQUE: 0,
  TRANSLUCENT: 1,
  OPAQUE_AND_TRANSLUCENT: 2
};



/**
 * @constructor
 * @param {number=} opt_r .
 * @param {number=} opt_g .
 * @param {number=} opt_b .
 * @param {number=} opt_a .
 */
Cesium.Color = function(opt_r, opt_g, opt_b, opt_a) {};


/**
 * @type {!Cesium.Color}
 * @const
 */
Cesium.Color.YELLOW;


/**
 * @type {!Cesium.Color}
 * @const
 */
Cesium.Color.RED;


/**
 * @type {!Cesium.Color}
 */
Cesium.Color.WHITE;


/**
 * @type {!Cesium.Color}
 */
Cesium.Color.CYAN;


/**
 * @type {!Cesium.Color}
 */
Cesium.Color.TRANSPARENT;


/**
 * @param {number} value
 * @return {!Cesium.Color}
 */
Cesium.Color.fromRgba = function(value) {};


/**
 * @param {string} name
 * @return {!Cesium.Color}
 */
Cesium.Color.fromCssColorString = function(name) {};


/**
 * @param {!Array.<number>} color
 * @return {!Cesium.Color}
 */
Cesium.Color.unpack = function(color) {};


/**
 * @param {number} component Integer in range [0-255]
 * @return {number} float in range [0-1]
 */
Cesium.Color.byteToFloat = function(component) {};



/**
 * @constructor
 * @param {string} text
 * @param {Object=} opt_description
 * @return {HTMLCanvasElement}
 */
Cesium.prototype.writeTextToCanvas = function(text, opt_description) {};



/**
 * @constructor
 */
Cesium.Billboard = function() {};


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Billboard.prototype.alignedAxis;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Billboard.prototype.eyeOffset;


/**
 * @type {!Cesium.HeightReference}
 */
Cesium.Billboard.prototype.heightReference;


/**
 * @type {!Cesium.HorizontalOrigin}
 */
Cesium.Billboard.prototype.horizontalOrigin;


/**
 * @type {number}
 */
Cesium.Billboard.prototype.imageIndex;


/**
 * @type {!Cesium.Cartesian2}
 */
Cesium.Billboard.prototype.pixelOffset;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Billboard.prototype.position;


/**
 * @type {number}
 */
Cesium.Billboard.prototype.rotation;


/**
 * @type {number}
 */
Cesium.Billboard.prototype.scale;


/**
 * @type {boolean}
 */
Cesium.Billboard.prototype.show;


/**
 * @type {!Cesium.VerticalOrigin}
 */
Cesium.Billboard.prototype.verticalOrigin;


/**
 * Custom property for storing the last OL3 geometry revision.
 * @type {number|undefined}
 */
Cesium.Billboard.prototype.geomRevision;


/**
 * @param {string|number} id The image id
 * @param {HTMLCanvasElement|HTMLVideoElement|Image|string} image The new image
 */
Cesium.Billboard.prototype.setImage = function(id, image) {};



/**
 * @constructor
 */
Cesium.VerticalOrigin = function() {};


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.TOP;


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.CENTER;


/**
 * @type {!Cesium.VerticalOrigin} .
 */
Cesium.VerticalOrigin.BOTTOM;



/**
 * @param {number} near
 * @param {number} nearValue
 * @param {number} far
 * @param {number} farValue
 * @constructor
 */
Cesium.NearFarScalar = function(near, nearValue, far, farValue) {};


/**
 * @typedef {{
 *   blendOption: (Cesium.BlendOption|undefined),
 *   debugShowBoundingVolume: (boolean|undefined),
 *   scene: (Cesium.Scene|undefined)
 * }}
 */
Cesium.BillboardCollectionOptions;



/**
 * @param {Cesium.BillboardCollectionOptions=} opt_options
 * @extends {Cesium.Primitive} // as it can be added to PrimitiveCollection...
 * @constructor
 */
Cesium.BillboardCollection = function(opt_options) {};


/**
 * @typedef {{
 *   image: (string|HTMLCanvasElement|HTMLImageElement|Image),
 *   imageId: (string|number),
 *   color: (Cesium.Color|undefined),
 *   verticalOrigin: (Cesium.VerticalOrigin|undefined),
 *   heightReference: (Cesium.HeightReference|undefined),
 *   horizontalOrigin: (Cesium.HorizontalOrigin|undefined),
 *   pixelOffset: (Cesium.Cartesian2|undefined),
 *   pixelOffsetScaleByDistance : (Cesium.NearFarScalar|undefined),
 *   scale: (number|undefined),
 *   scaleByDistance: (Cesium.NearFarScalar|undefined),
 *   position: !Cesium.Cartesian3,
 *   geomRevision: (number|undefined)
 * }}
 */
Cesium.optionsBillboardCollectionAdd;


/**
 * @param {Cesium.optionsBillboardCollectionAdd} options
 * @return {!Cesium.Billboard}
 */
Cesium.BillboardCollection.prototype.add = function(options) {};


/**
 * @param {Cesium.Billboard=} opt_bb
 * @return {boolean}
 */
Cesium.BillboardCollection.prototype.contains = function(opt_bb) {};


/**
 * @return {boolean} .
 */
Cesium.BillboardCollection.prototype.isDestroyed = function() {};


/**
 * @type {number}
 */
Cesium.BillboardCollection.prototype.length;


/**
 * @param {Cesium.Billboard} what .
 */
Cesium.BillboardCollection.prototype.remove = function(what) {};


/**
 * @type {boolean} .
 */
Cesium.BillboardCollection.prototype.sizeReal;


/**
 * @type {Cesium.TextureAtlas}
 */
Cesium.BillboardCollection.prototype.textureAtlas;



/**
 * @param {Object.<string, *>} opts
 * @constructor
 */
Cesium.TextureAtlas = function(opts) {};


/**
 * @param {Image} image .
 */
Cesium.TextureAtlas.prototype.addImage = function(image) {};


/**
 * @type {Array.<Cesium.BoundingRectangle>} .
 */
Cesium.TextureAtlas.prototype.textureCoordinates;


/**
 * @type {!Cesium.Texture} .
 */
Cesium.TextureAtlas.prototype.texture;



/**
 * @constructor
 */
Cesium.Texture = function() {};


/**
 * @type {number} .
 */
Cesium.Texture.prototype.width;


/**
 * @type {number} .
 */
Cesium.Texture.prototype.height;



/**
 * @constructor
 */
Cesium.BoundingRectangle = function() {};


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.x;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.y;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.width;


/**
 * @type {number}
 */
Cesium.BoundingRectangle.prototype.height;



/**
 * @constructor
 */
Cesium.Camera = function() {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.direction;


/**
 * @type {Cesium.PerspectiveFrustrum}
 */
Cesium.Camera.prototype.frustum;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.position;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.right;


/**
 * @type {Cesium.Matrix4}
 */
Cesium.Camera.prototype.transform;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Camera.prototype.up;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Camera.prototype.constrainedAxis;


/**
 * @type {number|undefined}
 */
Cesium.Camera.prototype.constrainedAxisAngle;


/**
 * @type {!Cesium.Cartographic} .
 */
Cesium.Camera.prototype.positionCartographic;


/**
 * @type {Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.positionWC;


/**
 * @type {number}
 */
Cesium.Camera.prototype.heading;


/**
 * @type {!Cesium.RemovedAPI}
 */
Cesium.Camera.prototype.tilt;


/**
 * @type {number}
 * @const
 */
Cesium.Camera.prototype.pitch;


/**
 * @type {number}
 * @const
 */
Cesium.Camera.prototype.roll;


/**
 * @type {Cesium.Event}
 * @const
 */
Cesium.Camera.prototype.moveStart;


/**
 * @type {Cesium.Event}
 * @const
 */
Cesium.Camera.prototype.moveEnd;


/**
 *
 */
Cesium.Camera.prototype.cancelFlight = function() {};


/**
 * @param {!Cesium.Cartesian2} windowPosition
 * @param {Cesium.Ray=} opt_result
 * @return {!Cesium.Ray}
 */
Cesium.Camera.prototype.getPickRay = function(windowPosition, opt_result) {};


/**
 * @param {Cesium.Ellipsoid=} opt_ellipsoid The ellipsoid. Defaults to WGS84.
 * @param {Cesium.Rectangle=} opt_result The rectangle instance in which to place the results
 * @return {Cesium.Rectangle} The retangle containing the camera view bounds
 */
Cesium.Camera.prototype.computeViewRectangle = function(opt_ellipsoid, opt_result) {};


/**
 * @param {Cesium.Cartesian4} cartesian .
 * @param {Cesium.Cartesian4=} opt_result .
 * @return {Cesium.Cartesian4} .
 */
Cesium.Camera.prototype.worldToCameraCoordinates = function(cartesian, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian .
 * @param {Cesium.Cartesian3=} opt_result .
 * @return {Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.worldToCameraCoordinatesPoint = function(cartesian, opt_result) {};


/**
 * @param {!Cesium.RemovedAPI} transform
 */
Cesium.Camera.prototype.setTransform = function(transform) {};


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.Camera.prototype.viewMatrix;


/**
 * @typedef {Object}
 */
Cesium.CameraEventType;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.LEFT_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.MIDDLE_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.PINCH;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.RIGHT_DRAG;


/**
 * @type {Cesium.CameraEventType}
 */
Cesium.CameraEventType.WHEEL;


/**
 * @typedef {number}
 */
Cesium.KeyboardEventModifier;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.ALT;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.CTRL;


/**
 * @type {Cesium.KeyboardEventModifier}
 */
Cesium.KeyboardEventModifier.SHIFT;



/**
 * @param {Object} canvas .
 * @constructor
 */
Cesium.CameraEventAggregator = function(canvas) {};


/**
 * @type {Cesium.ScreenSpaceEventHandler}
 */
Cesium.CameraEventAggregator.prototype._eventHandler;


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isMoving = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {{startPosition: Cesium.Cartesian2, endPosition: Cesium.Cartesian2}} .
 */
Cesium.CameraEventAggregator.prototype.getMovement = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {Object} .
 */
Cesium.CameraEventAggregator.prototype.getLastMovement = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isButtonDown = function(type, opt_mod) {};


/**
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.anyButtonDown = function() {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {number} .
 */
Cesium.CameraEventAggregator.prototype.getButtonPressTime = function(type, opt_mod) {};


/**
 * @param {Object} type
 * @param {Object=} opt_mod
 * @return {number} .
 */
Cesium.CameraEventAggregator.prototype.getButtonReleaseTime = function(type, opt_mod) {};


/**
 * @return {boolean} .
 */
Cesium.CameraEventAggregator.prototype.isDestroyed = function() {};


/**
 */
Cesium.CameraEventAggregator.prototype.destroy = function() {};


/**
 * @type {!Cesium.RemovedAPI}
 */
Cesium.Camera.prototype.setPositionCartographic;


/**
 * @typedef {{
 *    heading: (number|undefined),
 *    pitch: (number|undefined),
 *    roll: (number|undefined)
 * }}
 */
Cesium.optionsOrientation;


/**
 * @typedef {{
 *  destination: (Cesium.Cartesian3|Cesium.Rectangle|undefined),
 *  orientation: (Cesium.optionsOrientation|undefined),
 *  position: (Cesium.RemovedAPI|undefined),
 *  positionCartographic: (Cesium.RemovedAPI|undefined),
 *  heading: (undefined|Cesium.RemovedAPI),
 *  pitch: (undefined|Cesium.RemovedAPI),
 *  roll: (undefined|Cesium.RemovedAPI)
 * }}
 */
Cesium.optionsCameraSetView;


/**
 * @param {Cesium.optionsCameraSetView} options
 */
Cesium.Camera.prototype.setView = function(options) {};


/**
 * @param {Cesium.Cartesian3} eye .
 * @param {Cesium.Cartesian3} target .
 * @param {Cesium.Cartesian3} up .
 */
Cesium.Camera.prototype.lookAt = function(eye, target, up) {};


/**
 * @param {Cesium.Matrix4} transform
 */
Cesium.Camera.prototype.lookAtTransform = function(transform) {};


/**
 * @param {Cesium.Cartesian3} axis
 * @param {number} angle
 */
Cesium.Camera.prototype.rotate = function(axis, angle) {};


/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateUp = function(angle) {};


/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateDown = function(angle) {};


/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateLeft = function(angle) {};


/**
 * @param {number} angle
 */
Cesium.Camera.prototype.rotateRight = function(angle) {};


/**
 * @param {number=} opt_amount .
 */
Cesium.Camera.prototype.twistLeft = function(opt_amount) {};


/**
 * @param {number=} opt_amount .
 */
Cesium.Camera.prototype.twistRight = function(opt_amount) {};


/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookLeft = function(amount) {};


/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookRight = function(amount) {};


/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookUp = function(amount) {};


/**
 * @param {number} amount .
 */
Cesium.Camera.prototype.lookDown = function(amount) {};


/**
 * @param {!Cesium.Cartesian3} direction
 * @param {number} amount
 */
Cesium.Camera.prototype.move = function(direction, amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveDown = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveBackward = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveForward = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveLeft = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveRight = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.moveUp = function(amount) {};


/**
 * @param {!Cesium.Cartesian2} windowPos .
 * @param {Cesium.Ellipsoid=} opt_ellipsoid .
 * @return {!Cesium.Cartesian3} .
 */
Cesium.Camera.prototype.pickEllipsoid = function(windowPos, opt_ellipsoid) {};


/**
 * @type {!Object<string, !function(number):number>}
 */
Cesium.EasingFunction;


/**
 * @param {number} n
 * @return {number}
 * @private
 */
Cesium.EasingFunction.LINEAR_NONE = function(n) {};


/**
 * @typedef {{
 *   destination: (!Cesium.Cartesian3|Cesium.Rectangle),
 *   orientation: (!Cesium.optionsOrientation|undefined),
 *   duration: (number|undefined),
 *   complete: (function()|undefined),
 *   cancel: (function()|undefined),
 *   endTransform: (Cesium.Matrix4|undefined),
 *   convert: (boolean|undefined),
 *   maximumHeight: (number|undefined),
 *   easingFunction: (function(number): number|undefined)
 * }}
 */
Cesium.optionsCameraFlyTo;


/**
 * @typedef {{
 *   offset: (!Cesium.HeadingPitchRange|undefined),
 *   duration: (number|undefined),
 *   complete: (function()|undefined),
 *   cancel: (function()|undefined),
 *   endTransform: (Cesium.Matrix4|undefined),
 *   convert: (boolean|undefined),
 *   maximumHeight: (number|undefined),
 *   easingFunction: (function(number): number|undefined)
 * }}
 */
Cesium.optionsCameraFlyToBoundingSphere;


/**
 * @param {!Cesium.optionsCameraFlyTo} options
 */
Cesium.Camera.prototype.flyTo = function(options) {};


/**
 * @param {!Cesium.BoundingSphere} boundingSphere The bounding sphere
 * @param {!Cesium.optionsCameraFlyToBoundingSphere} options The flyTo options
 */
Cesium.Camera.prototype.flyToBoundingSphere = function(boundingSphere, options) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.zoomIn = function(amount) {};


/**
 * @param {number} amount
 */
Cesium.Camera.prototype.zoomOut = function(amount) {};



/**
 * @constructor
 * @param {number=} opt_x
 * @param {number=} opt_y
 */
Cesium.Cartesian2 = function(opt_x, opt_y) {};


/**
 * @type {number}
 */
Cesium.Cartesian2.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian2.prototype.y;


/**
 * @param {Cesium.Cartesian2=} opt_result
 * @return {Cesium.Cartesian2}
 */
Cesium.Cartesian2.prototype.clone = function(opt_result) {};


/**
 * @param {Cesium.Cartesian2} cartesian
 * @param {Cesium.Cartesian2=} opt_result
 * @return {Cesium.Cartesian2}
 */
Cesium.Cartesian2.clone = function(cartesian, opt_result) {};



/**
 * @constructor
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @param {number=} opt_z
 */
Cesium.Cartesian3 = function(opt_x, opt_y, opt_z) {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_X;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_Y;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.UNIT_Z;


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.ZERO;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.y;


/**
 * @type {number}
 */
Cesium.Cartesian3.prototype.z;


/**
 * @param {!Cesium.Cartesian3} start
 * @param {!Cesium.Cartesian3} end
 * @param {number} t
 * @param {!Cesium.Cartesian3} result
 */
Cesium.Cartesian3.lerp = function(start, end, t, result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @return {number}
 */
Cesium.Cartesian3.magnitude = function(left) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @return {number}
 */
Cesium.Cartesian3.magnitudeSquared = function(cartesian) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.add = function(left, right, opt_result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.subtract = function(left, right, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.normalize = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.negate = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.cross = function(left, right, opt_result) {};


/**
 * @param {!Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Cartesian3.clone = function(cartesian, opt_result) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.dot = function(left, right) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.distance = function(left, right) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {number}
 */
Cesium.Cartesian3.angleBetween = function(left, right) {};


/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Cesium.Cartesian3} result
 */
Cesium.Cartesian3.fromElements = function(x, y, z, result) {};


/**
 * @param {Cesium.Cartesian3} right
 * @return {boolean}
 */
Cesium.Cartesian3.prototype.equals = function(right) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @return {boolean}
 */
Cesium.Cartesian3.equals = function(left, right) {};


/**
 * @param {Cesium.Cartesian3} right
 * @param {number} relativeEpsilon
 * @param {number=} opt_absoluteEpsilon
 * @return {boolean}
 */
Cesium.Cartesian3.prototype.equalsEpsilon = function(right, relativeEpsilon, opt_absoluteEpsilon) {};


/**
 * @param {Cesium.Cartesian3} left
 * @param {Cesium.Cartesian3} right
 * @param {number} relativeEpsilon
 * @param {number=} opt_absoluteEpsilon
 * @return {boolean}
 */
Cesium.Cartesian3.equalsEpsilon = function(left, right, relativeEpsilon, opt_absoluteEpsilon) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {number} scalar
 * @param {Cesium.Cartesian3} result
 */
Cesium.Cartesian3.multiplyByScalar = function(cartesian, scalar, result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 */
Cesium.Cartesian3.mostOrthogonalAxis = function(cartesian, result) {};



/**
 * @constructor
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @param {number=} opt_z
 * @param {number=} opt_w
 */
Cesium.Cartesian4 = function(opt_x, opt_y, opt_z, opt_w) {};


/**
 * @type {Cesium.Cartesian4}
 */
Cesium.Cartesian4.UNIT_W;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.x;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.y;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.z;


/**
 * @type {number}
 */
Cesium.Cartesian4.prototype.w;


/**
 * @param {Cesium.Cartesian4} result
 */
Cesium.Cartesian4.clone = function(result) {};



/**
 * @constructor
 * @param {number=} opt_longitude
 * @param {number=} opt_latitude
 * @param {number=} opt_height
 */
Cesium.Cartographic = function(opt_longitude, opt_latitude, opt_height) {};


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.longitude;


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.latitude;


/**
 * @type {number}
 */
Cesium.Cartographic.prototype.height;


/**
 * @param {Cesium.Cartesian3} position
 */
Cesium.Cartographic.prototype.fromCartesian = function(position) {};


/**
 * @param {Cesium.Cartographic=} opt_result
 * @return {!Cesium.Cartographic}
 */
Cesium.Cartographic.prototype.clone = function(opt_result) {};


/**
 * @param {number} lat .
 * @param {number} lng .
 * @return {!Cesium.Cartographic}
 */
Cesium.Cartographic.fromDegrees = function(lat, lng) {};


/**
 * @param {Cesium.Cartesian3} position
 */
Cesium.Cartographic.fromCartesian = function(position) {};



/**
 * @constructor
 * @param {number} heading
 * @param {number} pitch
 * @param {number} roll
 */
Cesium.HeadingPitchRoll = function(heading, pitch, roll) {};


/**
 * @constructor
 * @param {number} heading
 * @param {number} pitch
 * @param {number} range
 */
Cesium.HeadingPitchRange = function(heading, pitch, range) {};


/**
 * @constructor
 * @param {Cesium.Cartesian3=} opt_origin
 * @param {Cesium.Cartesian3=} opt_direction
 */
Cesium.Ray = function(opt_origin, opt_direction) {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Ray.prototype.direction;



/**
 * @constructor
 * @param {Cesium.Ellipsoid} ellipsoid
 */
Cesium.Globe = function(ellipsoid) {};


/**
 * @type {Cesium.Color}
 */
Cesium.Globe.prototype.baseColor;


/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.Globe.prototype.ellipsoid;


/**
 * @type {boolean}
 */
Cesium.Globe.prototype.enableLighting;


/**
 * @type {boolean}
 */
Cesium.Globe.prototype.depthTestAgainstTerrain;


/**
 * @param {!Cesium.Cartographic} cartographic
 * @return {number|undefined}
 */
Cesium.Globe.prototype.getHeight = function(cartographic) {};


/**
 * @param {!Cesium.Ray} ray
 * @param {!Cesium.Scene} scene
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3|undefined}
 */
Cesium.Globe.prototype.pick = function(ray, scene, opt_result) {};



/**
 * @param {Object.<string, *>=} opt_opts
 * @constructor
 */
Cesium.Polygon = function(opt_opts) {};


/**
 * @type {!Array.<!Cesium.Cartesian3>}
 */
Cesium.Polygon.prototype.positions;


/**
 * @type {!Cesium.Material} material .
 */
Cesium.Polygon.prototype.material;


/**
 * Merge of all values
 * @typedef {{
 *   color: (Cesium.Color|undefined),
 *   horizontal: (boolean|undefined),
 *   repeat: (number|undefined),
 *   evenColor: (Cesium.Color|undefined),
 *   oddColor: (Cesium.Color|undefined)
 * }}
 */
Cesium.optionsMaterialFromTypeAny;


/**
 * @param {string} type .
 * @param {Cesium.optionsMaterialFromTypeAny=} opt_uniforms .
 */
Cesium.Material.fromType = function(type, opt_uniforms) {};


/**
 * @type {boolean} .
 */
Cesium.Polygon.prototype.show;


/**
 */
Cesium.Polygon.prototype.update = function() {};



/**
 * @constructor
 */
Cesium.PolylineCollection = function() {};


/**
 * @param {Cesium.PolylineOptions=} opt_opts .
 * @return {!Cesium.Polyline} .
 */
Cesium.PolylineCollection.prototype.add = function(opt_opts) {};


/**
 * @param {!Cesium.Polyline} polyline
 */
Cesium.PolylineCollection.prototype.remove = function(polyline) {};


/**
 * Removes all the things
 */
Cesium.PolylineCollection.prototype.removeAll = function() {};



/**
 * @constructor
 */
Cesium.PolylinePipeline = function() {};


/**
 * @param {Array<Cesium.Cartesian3>} positions The positions
 * @param {Cesium.Ellipsoid} ellipsoid The ellipsoid
 * @return {Array<number>} The heights from the ellipsoid surface
 */
Cesium.PolylinePipeline.extractHeights = function(positions, ellipsoid) {};


/**
 * @param {Object=} opt_opts
 * @return {Array.<Cesium.Cartesian3>}
 */
Cesium.PolylinePipeline.generateCartesianArc = function(opt_opts) {};



/**
 * @constructor
 */
Cesium.Material = function() {};


/**
 * @type {!Object} .
 */
Cesium.Material.prototype.uniforms;


/**
 * @type {string} .
 */
Cesium.Material.ColorType;


/**
 * @typedef {{
 *   material: (Cesium.Material|undefined),
 *   positions: (Array<Cesium.Cartesian3>|undefined),
 *   show: (boolean|undefined),
 *   width: (number|undefined)
 * }}
 */
Cesium.PolylineOptions;



/**
 * @constructor
 */
Cesium.Polyline = function() {};


/**
 * @type {boolean}
 */
Cesium.Polyline.prototype.dirty;


/**
 * Custom property for storing the last OL3 geometry revision.
 * @type {number|undefined}
 */
Cesium.Polyline.prototype.geomRevision;


/**
 * @type {!Array.<!Cesium.Cartesian3>}
 */
Cesium.Polyline.prototype.positions;


/**
 * @type {!Cesium.Material}
 */
Cesium.Polyline.prototype.material;


/**
 * @type {boolean}
 */
Cesium.Polyline.prototype.show;


/**
 * @type {number}
 */
Cesium.Polyline.prototype.width;



/**
 * @constructor
 */
Cesium.Appearance = function() {};


/**
 * @typedef {{
 *   asynchronous: (boolean|undefined),
 *   releaseGeometryInstances: (boolean|undefined),
 *   geometryInstances: !Cesium.GeometryInstance,
 *   appearance: !Cesium.Appearance
 * }}
 */
Cesium.optionsPrimitive;



/**
 * @constructor
 * @param {Cesium.optionsPrimitive=} opt_opts
 */
Cesium.Primitive = function(opt_opts) {};


/**
 * Custom property for storing the associated Ol3 feature.
 * http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Picking.html&label=Showcases
 * @type {ol.Feature}
 */
Cesium.Primitive.prototype.olFeature;


/**
 * Custom property for storing the associated Ol3 geometry.
 * http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Picking.html&label=Showcases
 * @type {ol.geom.Geometry}
 */
Cesium.Primitive.prototype.olGeometry;


/**
 * Custom property for storing the associated Ol3 layer.
 * http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Picking.html&label=Showcases
 * @type {ol.layer.Layer}
 */
Cesium.Primitive.prototype.olLayer;


/**
 * The geometry instance(s)
 * @type {Cesium.GeometryInstance|Array.<Cesium.GeometryInstance>|undefined}
 */
Cesium.Primitive.prototype.geometryInstances;


/**
 * Custom property for storing the last OL3 geometry revision.
 * @type {number|undefined}
 */
Cesium.Primitive.prototype.geomRevision;


/**
 * @type {boolean}
 */
Cesium.Primitive.prototype.ready;


/**
 * @param {string=} opt_id The id of the Cesium.GeometryInstance
 * @return {Cesium.GeometryInstanceAttribute|undefined}
 */
Cesium.Primitive.prototype.getGeometryInstanceAttributes = function(opt_id) {};


/**
 * @typedef {{
 *   geometryInstances: (!Cesium.GeometryInstance|undefined),
 *   geometryInstance: (!Cesium.GeometryInstance|undefined)
 * }}
 */
Cesium.optionsGroundPrimitive;



/**
 * @constructor
 * @param {Cesium.optionsGroundPrimitive=} opt_opts
 * @extends {Cesium.Primitive}
 */
Cesium.GroundPrimitive = function(opt_opts) {};



/**
 * @constructor
 */
Cesium.Label = function() {};


/**
 * @type {!Cesium.Cartesian3}
 */
Cesium.Label.prototype.eyeOffset;


/**
 * @type {!Cesium.Color}
 */
Cesium.Label.prototype.fillColor;


/**
 * @type {!Cesium.Color}
 */
Cesium.Label.prototype.outlineColor;


/**
 * @type {number}
 */
Cesium.Label.prototype.outlineWidth;


/**
 * @type {string}
 */
Cesium.Label.prototype.text;


/**
 * @type {string}
 */
Cesium.Label.prototype.font;


/**
 * @type {Cesium.Cartesian2}
 */
Cesium.Label.prototype.pixelOffset;


/**
 * @type {number}
 */
Cesium.Label.prototype.style;


/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.Label.prototype.horizontalOrigin;


/**
 * @type {Cesium.VerticalOrigin}
 */
Cesium.Label.prototype.verticalOrigin;


/**
 * @type {Cesium.HeightReference}
 */
Cesium.Label.prototype.heightReference;


/**
 * Custom property for storing the last OL3 geometry revision.
 * @type {number|undefined}
 */
Cesium.Label.prototype.geomRevision;



/**
 * @constructor
 * @param {{ scene: Cesium.Scene }=} opt_options
 * @extends {Cesium.Primitive}
 */
Cesium.LabelCollection = function(opt_options) {};



/**
 * @constructor
 * @struct
 */
Cesium.optionsLabelCollection = function() {};


/**
 * @type {string| undefined}
 */
Cesium.optionsLabelCollection.prototype.text;


/**
 * @type {string| undefined}
 */
Cesium.optionsLabelCollection.prototype.font;


/**
 * @type {Cesium.Cartesian2| undefined}
 */
Cesium.optionsLabelCollection.prototype.pixelOffset;


/**
 * @type {Cesium.Cartesian3|undefined}
 */
Cesium.optionsLabelCollection.prototype.position;


/**
 * @type {Cesium.Color|undefined}
 */
Cesium.optionsLabelCollection.prototype.fillColor;


/**
 * @type {Cesium.Color|undefined}
 */
Cesium.optionsLabelCollection.prototype.outlineColor;


/**
 * @type {number|undefined}
 */
Cesium.optionsLabelCollection.prototype.outlineWidth;


/**
 * @type {boolean|undefined}
 */
Cesium.optionsLabelCollection.prototype.show;


/**
 * @type {number|undefined}
 */
Cesium.optionsLabelCollection.prototype.style;


/**
 * @type {Cesium.HorizontalOrigin|undefined}
 */
Cesium.optionsLabelCollection.prototype.horizontalOrigin;


/**
 * @type {Cesium.VerticalOrigin|undefined}
 */
Cesium.optionsLabelCollection.prototype.verticalOrigin;


/**
 * @type {Cesium.HeightReference|undefined}
 */
Cesium.optionsLabelCollection.prototype.heightReference;


/**
 * Custom property for storing the last OL3 geometry revision.
 * @type {number|undefined}
 */
Cesium.optionsLabelCollection.prototype.geomRevision;


/**
 * @param {Cesium.optionsLabelCollection=} opt_opts
 * @return {!Cesium.Label}
 */
Cesium.LabelCollection.prototype.add = function(opt_opts) {};


/**
 * @param {Cesium.Label} label
 * @return {boolean}
 */
Cesium.LabelCollection.prototype.contains = function(label) {};


/**
 * @param {number} index
 * @return {!Cesium.Label}
 */
Cesium.LabelCollection.prototype.get = function(index) {};


/**
 * @return {boolean}
 */
Cesium.LabelCollection.prototype.isDestroyed = function() {};


/**
 * @param {Cesium.Label} label
 * @return {boolean}
 */
Cesium.LabelCollection.prototype.remove = function(label) {};


/**
 * @return {boolean}
 */
Cesium.LabelCollection.prototype.removeAll = function() {};


/**
 * @type {Cesium.Matrix4}
 */
Cesium.LabelCollection.prototype.modelMatrix;



/**
 * @constructor
 */
Cesium.LabelStyle = function() {};


/**
 * @type {number}
 */
Cesium.LabelStyle.FILL;


/**
 * @type {number}
 */
Cesium.LabelStyle.OUTLINE;


/**
 * @type {number}
 */
Cesium.LabelStyle.FILL_AND_OUTLINE;



/**
 * @constructor
 */
Cesium.Geometry = function() {};


/**
 * @typedef {{
 * center: !Cesium.Cartesian3,
 * height: (number|undefined),
 * extrudedHeight: (number|undefined),
 * radius: number
 * }}
 */
Cesium.optionsCircleGeometry;



/**
 * @constructor
 * @param {Cesium.optionsCircleGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.CircleGeometry = function(opt_opts) {};


/**
 * @typedef {{
 * center: !Cesium.Cartesian3,
 * height: (number|undefined),
 * extrudedHeight: (number|undefined),
 * radius: number
 * }}
 */
Cesium.optionsCircleOutlineGeometry;



/**
 * @constructor
 * @param {Cesium.optionsCircleOutlineGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.CircleOutlineGeometry = function(opt_opts) {};


/**
 * @typedef {{
 *   center: !Cesium.Cartesian3,
 *   semiMajorAxis: number,
 *   semiMinorAxis: number,
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   rotation: (number|undefined),
 *   stRotation: (number|undefined),
 *   granularity: (number|undefined),
 *   vertexFormat: (Cesium.VertexFormat|undefined)
 * }}
 */
Cesium.optionsEllipseGeometry;



/**
 * @constructor
 * @param {Cesium.optionsEllipseGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.EllipseGeometry = function(opt_opts) {};


/**
 * @typedef {{
 *   center: !Cesium.Cartesian3,
 *   semiMajorAxis: number,
 *   semiMinorAxis: number,
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   height: (number|undefined),
 *   extrudedHeight: (number|undefined),
 *   rotation: (number|undefined),
 *   granularity: (number|undefined),
 *   numberOfVerticalLines: (number|undefined)
 * }}
 */
Cesium.optionsEllipseOutlineGeometry;



/**
 * @constructor
 * @param {Cesium.optionsEllipseGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.EllipseOutlineGeometry = function(opt_opts) {};


/**
 * @typedef {{
 *   radii: (Cesium.Cartesian3|undefined),
 *   stackPartitions: (number|undefined),
 *   slicePartitions: (number|undefined),
 *   vertexFormat: (Cesium.VertexFormat|undefined)
 * }}
 */
Cesium.optionsEllipsoidGeometry;



/**
 * @constructor
 * @param {Cesium.optionsEllipsoidGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.EllipsoidGeometry = function(opt_opts) {};



/**
 * @constructor
 * @param {Cesium.optionsEllipsoidGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.EllipsoidOutlineGeometry = function(opt_opts) {};


/**
 * @typedef {{
 * rectangle: !Cesium.Rectangle
 * }}
 */
Cesium.optionsRectangleGeometry;



/**
 * @constructor
 * @param {Cesium.optionsRectangleGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.RectangleGeometry = function(opt_opts) {};



/**
 * @constructor
 * @param {Cesium.optionsRectangleGeometry=} opt_opts
 * @extends {Cesium.Geometry}
 */
Cesium.RectangleOutlineGeometry = function(opt_opts) {};



/**
 * @constructor
 * @param {number} red
 * @param {number} green
 * @param {number} blue
 * @param {number} alpha
 */
Cesium.ColorGeometryInstanceAttribute = function(red, green, blue, alpha) {};


/**
 * @param {!Cesium.Color} color
 * @return {!Cesium.ColorGeometryInstanceAttribute}
 */
Cesium.ColorGeometryInstanceAttribute.fromColor = function(color) {};


/**
 * @param {!Cesium.Color} color
 * @param {Cesium.ColorGeometryInstanceAttribute=} opt_result
 * @return {!Cesium.ColorGeometryInstanceAttribute}
 */
Cesium.ColorGeometryInstanceAttribute.toValue = function(color, opt_result) {};



/**
 * @constructor
 * @struct
 */
Cesium.optionsGeometryInstance = function() {};


/**
 * @type {string}
 */
Cesium.optionsGeometryInstance.prototype.id;


/**
 * @type {!Cesium.Geometry}
 */
Cesium.optionsGeometryInstance.prototype.geometry;


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.optionsGeometryInstance.prototype.modelMatrix;



/**
 * @constructor
 * @struct {Cesium.GeometryInstanceAttribute}
 */
Cesium.GeometryInstanceAttribute;


/**
 * @type {Cesium.GeometryInstanceAttribute| undefined}
 */
Cesium.optionsGeometryInstance.prototype.attributes;


/**
 * @type {Cesium.ColorGeometryInstanceAttribute}
 */
Cesium.GeometryInstanceAttribute.prototype.color;



/**
 * @constructor
 * @param {Object} object
 */
Cesium.GeometryInstance = function(object) {};



/**
 * @constructor
 */
Cesium.HorizontalOrigin = function() {};


/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.LEFT;


/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.CENTER;


/**
 * @type {Cesium.HorizontalOrigin}
 */
Cesium.HorizontalOrigin.RIGHT;


/**
 * @typedef {{
 * enabled: (boolean| undefined)
 * }}
 */
Cesium.optionsDepthTest;


/**
 * @typedef {{
 * lineWidth: (number| undefined),
 * depthTest: (Cesium.optionsDepthTest|undefined)
 * }}
 */
Cesium.optionsRenderState;


/**
 * @typedef {{
 * flat: (boolean| undefined),
 * close: (boolean| undefined),
 * translucent: (boolean| undefined),
 * renderState: (Cesium.optionsRenderState|undefined)
 * }}
 */
Cesium.optionsPerInstanceColorAppearance;



/**
 * @constructor
 * @param {Object} object
 * @extends {Cesium.Appearance}
 */
Cesium.PerInstanceColorAppearance = function(object) {};



/**
 * @constructor
 * @param {Object} options
 */
Cesium.VertexFormat = function(options) {};


/**
 * @type {Cesium.VertexFormat}
 */
Cesium.PerInstanceColorAppearance.VERTEX_FORMAT;


/**
 * @typedef {{
 * positions: !Array.<Cesium.Cartesian3>,
 * holes: (Cesium.optionsPolygonHoles|undefined)
 * }}
 */
Cesium.optionsPolygonHoles;


/**
 * @typedef {{
 * positions: !Array.<Cesium.Cartesian3>,
 * holes: (Cesium.optionsPolygonHoles|undefined)
 * }}
 */
Cesium.optionsPolygonHierarchy;


/**
 * @typedef {{
 * width: (number|undefined),
 * height: (number|undefined),
 * extrudedHeight: (number|undefined),
 * perPositionHeight: (boolean|undefined),
 * polygonHierarchy: !Cesium.optionsPolygonHierarchy
 * }}
 */
Cesium.optionsPolygonOutlineGeometry;


/**
 * @typedef {{
 * positions: !Array.<Cesium.Cartesian3>,
 * height: (number|undefined),
 * extrudedHeight: (number|undefined),
 * perPositionHeight: (boolean|undefined),
 * polygonHierarchy: !Cesium.optionsPolygonHierarchy
 * }}
 */
Cesium.optionsPolygonGeometry;



/**
 * @constructor
 * @param {Array<Cesium.Cartesian3>=} opt_positions
 * @param {Array<Cesium.PolygonHierarchy>=} opt_holes
 */
Cesium.PolygonHierarchy = function(opt_positions, opt_holes) {};


/**
 * @type {Array<Cesium.Cartesian3>|undefined}
 */
Cesium.PolygonHierarchy.prototype.positions;


/**
 * @type {Array<Cesium.PolygonHierarchy>|undefined}
 */
Cesium.PolygonHierarchy.prototype.holes;



/**
 * @constructor
 * @param {Object=} opt_object
 * @extends {Cesium.Geometry}
 */
Cesium.PolygonGeometry = function(opt_object) {};


/**
 * @typedef {{
 * positions: !Array.<Cesium.Cartesian3>,
 * height: (number|undefined),
 * extrudedHeight: (number|undefined),
 * vertexFormat: number
 * }}
 */
Cesium.optionsPolylineGeometry;



/**
 * @constructor
 * @param {Object=} opt_object
 * @extends {Cesium.Geometry}
 */
Cesium.PolygonOutlineGeometry = function(opt_object) {};


/**
 * @typedef {{
 * positions: !Array.<Cesium.Cartesian3>,
 * vertexFormat: number
 * }}
 */
Cesium.optionsPolylineGeometry;



/**
 * @constructor
 * @param {Object=} opt_object
 * @extends {Cesium.Geometry}
 */
Cesium.PolylineGeometry = function(opt_object) {};


/**
 * @typedef {{
 *    translucent: (boolean|undefined),
 *    renderState: (Cesium.optionsRenderState|undefined)
 * }}
 */
Cesium.optionsPolylineColorAppearance;



/**
 * @constructor
 * @param {Cesium.optionsPolylineColorAppearance=} opt_opts
 * @extends {Cesium.Appearance}
 */
Cesium.PolylineColorAppearance = function(opt_opts) {};


/**
 * @type {number}
 */
Cesium.PolylineColorAppearance.prototype.vertexFormat;



/**
 * @constructor
 * @param {{material: Cesium.Material}} object
 * @extends {Cesium.Appearance}
 */
Cesium.PolylineMaterialAppearance = function(object) {};


/**
 * @type {number}
 */
Cesium.PolylineMaterialAppearance.prototype.vertexFormat;



/**
 * @constructor
 */
Cesium.Transforms = function() {};


/**
 * @param {Cesium.Cartesian3} origin .
 * @param {Cesium.Ellipsoid=} opt_ellipsoid .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {Cesium.Matrix4}
 */
Cesium.Transforms.eastNorthUpToFixedFrame = function(origin, opt_ellipsoid, opt_result) {};


/**
 * @param {Cesium.Cartesian3} origin .
 * @param {Cesium.HeadingPitchRoll} hpr .
 * @param {Cesium.Ellipsoid=} opt_ellipsoid .
 * @param {Function=} opt_transform .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {Cesium.Matrix4}
 */
Cesium.Transforms.headingPitchRollToFixedFrame = function(origin, hpr, opt_ellipsoid, opt_transform, opt_result) {};


/**
 * @typedef {
 *    !(Cesium.Polygon|
 *      Cesium.PolylineCollection|Cesium.Polyline|
 *      Cesium.BillboardCollection|Cesium.Billboard|
 *      Cesium.LabelCollection|Cesium.Label|
 *      Cesium.PrimitiveCollection|Cesium.Primitive)
 * }
 */
Cesium.PrimitiveLike;



/**
 * @constructor
 * @extends {Cesium.Primitive}
 */
Cesium.PrimitiveCollection = function() {};


/**
 * @param {!Cesium.PrimitiveLike} primitive
 */
Cesium.PrimitiveCollection.prototype.add = function(primitive) {};


/**
 * @param {!Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
Cesium.PrimitiveCollection.prototype.contains = function(primitive) {};


/**
 * @param {number} index
 * @return {Cesium.PrimitiveLike}
 */
Cesium.PrimitiveCollection.prototype.get = function(index) {};


/**
 * @param {!Cesium.PrimitiveLike} primitive
 */
Cesium.PrimitiveCollection.prototype.raiseToTop = function(primitive) {};


/**
 * @param {!Cesium.PrimitiveLike} primitive
 */
Cesium.PrimitiveCollection.prototype.remove = function(primitive) {};


/**
 */
Cesium.PrimitiveCollection.prototype.destroy = function() {};


/**
 *
 */
Cesium.PrimitiveCollection.prototype.removeAll = function() {};


/**
 * @type {boolean}
 */
Cesium.PrimitiveCollection.prototype.destroyPrimitives;


/**
 * @type {number}
 */
Cesium.PrimitiveCollection.prototype.length;



/**
 * @constructor
 * @param {string} proxy
 */
Cesium.DefaultProxy = function(proxy) {};


/**
 * @param {string} url
 * @return {string}
 */
Cesium.DefaultProxy.prototype.getURL = function(url) {};



/**
 * @constructor
 */
Cesium.Event = function() {};


/**
 * @param {function(this:T, ...)} handler
 * @param {T=} opt_scope
 * @return {function()}
 * @template T
 */
Cesium.Event.prototype.addEventListener = function(handler, opt_scope) {};


/**
 * @param {...*} var_args
 * @return {*}
 */
Cesium.Event.prototype.raiseEvent = function(var_args) {};


/**
 * @param {function(this:T, ...)} handler
 * @param {T=} opt_scope
 * @return {boolean}
 * @template T
 */
Cesium.Event.prototype.removeEventListener = function(handler, opt_scope) {};



/**
 * @param {string=} opt_msg
 * @extends {Cesium.Event}
 * @constructor
 */
Cesium.DeveloperError = function(opt_msg) {};



/**
 * @param {string=} opt_msg
 * @extends {Cesium.Event}
 * @constructor
 */
Cesium.RuntimeError = function(opt_msg) {};



/**
 * @typedef {{
 *   text: (string|undefined),
 *   imageUrl: (string|undefined),
 *   link: (string|undefined),
 * }}
 */
Cesium.CreditOptions;


/**
 * @constructor
 * @param {Cesium.CreditOptions} options
 */
Cesium.Credit = function(options) {};



/**
 * @constructor
 */
Cesium.TilingScheme = function() {};


/**
 * @type {Cesium.Ellipsoid}
 */
Cesium.TilingScheme.prototype.ellipsoid;


/**
 * @type {Cesium.Rectangle}
 */
Cesium.TilingScheme.prototype.rectangle;


/**
 * @param {number} level
 * @return {number}
 */
Cesium.TilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {};


/**
 * @param {number} level
 * @return {number}
 */
Cesium.TilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {};


/**
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @param {Object=} opt_result
 * @return {Cesium.Rectangle}
 */
Cesium.TilingScheme.prototype.tileXYToRectangle = function(x, y, level, opt_result) {};


/**
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @param {Object=} opt_result
 * @return {Cesium.Rectangle}
 */
Cesium.TilingScheme.prototype.tileXYToNativeRectangle = function(x, y, level, opt_result) {};


/**
 * @typedef {{
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   numberOfLevelZeroTilesX: (number|undefined),
 *   numberOfLevelZeroTilesY: (number|undefined)
 * }}
 */
Cesium.GeographicTilingSchemeOptions;



/**
 * @param {Cesium.GeographicTilingSchemeOptions=} opt_options
 * @extends {Cesium.TilingScheme}
 * @constructor
 */
Cesium.GeographicTilingScheme = function(opt_options) {};


/**
 * @typedef {{
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   numberOfLevelZeroTilesX: (number|undefined),
 *   numberOfLevelZeroTilesY: (number|undefined),
 *   rectangleSouthwestInMeters: (Cesium.Cartesian2|undefined),
 *   rectangleNortheastInMeters: (Cesium.Cartesian2|undefined)
 * }}
 */
Cesium.WebMercatorTilingSchemeOptions;



/**
 * @param {Cesium.WebMercatorTilingSchemeOptions=} opt_options
 * @extends {Cesium.TilingScheme}
 * @constructor
 */
Cesium.WebMercatorTilingScheme = function(opt_options) {};


/**
 * @typedef {{
 *     rectangle: (Cesium.Rectangle|undefined),
 *     alpha: (number|Function|undefined),
 *     brightness: (number|Function|undefined),
 *     contrast: (number|Function|undefined),
 *     hue: (number|Function|undefined),
 *     saturation: (number|Function|undefined),
 *     gamma: (number|Function|undefined),
 *     show: (boolean|undefined),
 *     maximumAnisotropy: (number|undefined),
 *     minimumTerrainLevel: (number|undefined),
 *     maximumTerrainLevel: (number|undefined)
 * }}
 */
Cesium.ImageryLayerOptions;



/**
 * @constructor
 * @param {Cesium.ImageryProvider} imageryProvider
 * @param {Cesium.ImageryLayerOptions=} opt_opts
 */
Cesium.ImageryLayer = function(imageryProvider, opt_opts) {};


/**
 * @type {Cesium.ImageryProvider}
 */
Cesium.ImageryLayer.prototype.imageryProvider;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.brightness;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.contrast;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.hue;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.alpha;


/**
 * @type {number}
 */
Cesium.ImageryLayer.prototype.saturation;


/**
 * @type {boolean}
 */
Cesium.ImageryLayer.prototype.show;


/**
 * @type {!Cesium.Rectangle}
 */
Cesium.ImageryLayer.prototype.rectangle;


/**
 * @param {string} url
 * @param {boolean=} opt_crossOrigin
 * @return {Cesium.Promise}
 */
Cesium.ImageryLayer.prototype.loadImage = function(url, opt_crossOrigin) {};


/**
 *
 */
Cesium.ImageryLayer.prototype.destroy = function() {};



/**
 * @constructor
 */
Cesium.ImageryLayerCollection = function() {};


/**
 * @param {Cesium.ImageryProvider} provider
 * @param {number=} opt_index
 */
Cesium.ImageryLayerCollection.prototype.addImageryProvider = function(provider, opt_index) {};


/**
 * @type {number}
 */
Cesium.ImageryLayerCollection.prototype.length;


/**
 * @param {number} index
 * @return {Cesium.ImageryLayer} layer
 */
Cesium.ImageryLayerCollection.prototype.get = function(index) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @return {number} index
 */
Cesium.ImageryLayerCollection.prototype.indexOf = function(layer) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @param {number=} opt_index
 */
Cesium.ImageryLayerCollection.prototype.add = function(layer, opt_index) {};


/**
 * @param {Cesium.ImageryLayer} layer
 */
Cesium.ImageryLayerCollection.prototype.raiseToTop = function(layer) {};


/**
 * @param {Cesium.ImageryLayer} layer
 * @param {boolean=} opt_destroy
 */
Cesium.ImageryLayerCollection.prototype.remove = function(layer, opt_destroy) {};


/**
 * @param {boolean=} opt_destroy
 */
Cesium.ImageryLayerCollection.prototype.removeAll = function(opt_destroy) {};



/**
 * @constructor
 */
Cesium.ImageryProvider = function() {};


/**
 * @return {boolean}
 */
Cesium.ImageryProvider.prototype.isReady = function() {};


/**
 * @type {Cesium.Rectangle}
 */
Cesium.ImageryProvider.prototype.rectangle;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.tileWidth;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.tileHeight;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.minimumLevel;


/**
 * @type {number}
 */
Cesium.ImageryProvider.prototype.maximumLevel;


/**
 * @type {boolean}
 */
Cesium.ImageryProvider.prototype.ready;


/**
 * @type {boolean}
 */
Cesium.ImageryProvider.prototype.hasAlphaChannel;


/**
 * @type {Object|undefined}
 */
Cesium.ImageryProvider.prototype.proxy;


/**
 * @type {string}
 */
Cesium.ImageryProvider.prototype.url;


/**
 *  @type {Cesium.TilingScheme}
 */
Cesium.ImageryProvider.prototype.tilingScheme;


/**
 * //@return {TileDiscardPolicy} The discard policy.
 * // TODO
 * @type {undefined}
 */
Cesium.ImageryProvider.prototype.tileDiscardPolicy;


/**
 * @type {Cesium.Event} The event.
 */
Cesium.ImageryProvider.prototype.errorEvent;


/**
 * @return {Cesium.Credit}
 */
Cesium.ImageryProvider.prototype.credit;


/**
 * @param {number} x The tile X coordinate.
 * @param {number} y The tile Y coordinate.
 * @param {number} level The tile level.
 * @return {Array.<Cesium.Credit>|undefined}
 */
Cesium.ImageryProvider.prototype.getTileCredits = function(x, y, level) {};


/**
 * @param {number} x The tile X coordinate.
 * @param {number} y The tile Y coordinate.
 * @param {number} level The tile level.
 * @return {Cesium.Promise|Element|undefined}
 */
Cesium.ImageryProvider.prototype.requestImage = function(x, y, level) {};


/**
 * @param {Cesium.ImageryProvider} imageryProvider
 * @param {string} url
 * @return {Cesium.Promise}
 */
Cesium.ImageryProvider.loadImage = function(imageryProvider, url) {};


Cesium.loadImage = {};


/**
 * @param {string} url
 * @param {boolean} crossOrigin
 * @param {Cesium.Promise} deferred
 */
Cesium.loadImage.createImage = function(url, crossOrigin, deferred) {};


/**
 * @type {function(string, boolean, Cesium.Promise)}
 */
Cesium.loadImage.defaultCreateImage;



/**
 * @constructor
 * @param {{url: string,
 *          key: (string|undefined),
 *          tileProtocol: (string|undefined),
 *          mapStyle: (string|undefined),
 *          tileDiscardPolicy: (Object|undefined),
 *          proxy: (Object|undefined)}} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.BingMapsImageryProvider = function(options) {};



/**
 * @constructor
 * @param {Cesium.Cartesian3=} opt_radii
 */
Cesium.Ellipsoid = function(opt_radii) {};


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.radii;


/**
 * @type {number}
 */
Cesium.Ellipsoid.prototype.maximumRadius;


/**
 * @type {!Cesium.Ellipsoid}
 */
Cesium.Ellipsoid.WGS84;


/**
 * @type {!Cesium.Ellipsoid}
 */
Cesium.Ellipsoid.UNIT_SPHERE;


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3=} opt_result
 */
Cesium.Ellipsoid.prototype.scaleToGeodeticSurface = function(cartesian, opt_result) {};


/**
 * @param {Cesium.Cartographic} cartographic
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.cartographicToCartesian = function(cartographic, opt_result) {};


/**
 * @param {!Array.<Cesium.Cartographic>} cartographics
 * @param {!Array.<Cesium.Cartesian3>=} opt_result
 * @return {!Array.<Cesium.Cartesian3>}
 */
Cesium.Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographics, opt_result) {};


/**
 * @param {!Array.<Cesium.Cartesian3>} cartesians
 * @param {!Array.<Cesium.Cartographic>=} opt_result
 * @return {!Array.<Cesium.Cartographic>}
 */
Cesium.Ellipsoid.prototype.cartesianArrayToCartographicArray = function(cartesians, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartographic=} opt_result
 * @return {Cesium.Cartographic}
 */
Cesium.Ellipsoid.prototype.cartesianToCartographic = function(cartesian, opt_result) {};


/**
 * @param {!Cesium.Cartesian3} position .
 * @param {Cesium.Cartesian3=} opt_result .
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.transformPositionToScaledSpace = function(position, opt_result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.geocentricSurfaceNormal = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {Cesium.Cartesian3}
 */
Cesium.Ellipsoid.prototype.geodeticSurfaceNormal = function(cartesian, result) {};


/**
 * @param {Cesium.Cartesian3} radii
 * @param {Cesium.Ellipsoid=} opt_result
 * @return {Cesium.Ellipsoid}
 */
Cesium.Ellipsoid.fromCartesian3 = function(radii, opt_result) {};


/**
 * @type {Object}
 */
Cesium.RectangleGeometryLibrary = {};


/**
 * @param {Cesium.Geometry} geometry
 * @param {Cesium.Rectangle} rectangle
 * @param {!Cesium.Cartographic} nwCorner
 * @return {{height: number, width: number}}
 */
Cesium.RectangleGeometryLibrary.computeOptions = function(geometry, rectangle, nwCorner) {};


/**
 * @param {{height: number, width: number}} options
 * @param {number} row
 * @param {number} col
 * @param {!Cesium.Cartesian3} position
 * @return {!Cesium.Cartesian3}
 */
Cesium.RectangleGeometryLibrary.computePosition = function(options, row, col, position) {};


/**
 * @type {Object}
 */
Cesium.EllipseGeometryLibrary = {};


/**
 * @param {Object} options
 * @param {boolean} addFillPositions
 * @param {boolean} addEdgePositions
 * @return {{outerPositions: !Array<number>}}
 */
Cesium.EllipseGeometryLibrary.computeEllipsePositions = function(options, addFillPositions, addEdgePositions) {};



/**
 * @constructor
 * @param {number=} opt_west
 * @param {number=} opt_south
 * @param {number=} opt_east
 * @param {number=} opt_north
 */
Cesium.Rectangle = function(opt_west, opt_south, opt_east, opt_north) {};


/** @type {number} */
Cesium.Rectangle.prototype.west;


/** @type {number} */
Cesium.Rectangle.prototype.south;


/** @type {number} */
Cesium.Rectangle.prototype.east;


/** @type {number} */
Cesium.Rectangle.prototype.north;


/** @type {!Cesium.Rectangle} */
Cesium.Rectangle.MAX_VALUE;


/**
 * @param {number} west
 * @param {number} south
 * @param {number} east
 * @param {number} north
 * @param {Cesium.Rectangle=} opt_result
 * @return {!Cesium.Rectangle}
 */
Cesium.Rectangle.fromDegrees = function(west, south, east, north, opt_result) {};


/**
 * @param {Array.<Cesium.Cartographic>} cartographics
 * @param {Cesium.Rectangle=} opt_result
 * @return {!Cesium.Rectangle}
 */
Cesium.Rectangle.fromCartographicArray = function(cartographics, opt_result) {};



/**
 * @constructor
 */
Cesium.FeatureDetection = function() {};


/**
 * @return {boolean}
 */
Cesium.FeatureDetection.supportsCrossOriginImagery = function() {};



/**
 * @constructor
 */
Cesium.Math = function() {};


/**
 * @param {number} value
 * @return {number}
 */
Cesium.Math.acosClamped = function(value) {};


/**
 * @param {number} angle Angle in radians.
 * @return {number} angle in range [-Pi, Pi].
 */
Cesium.Math.convertLongitudeRange = function(angle) {};


/**
 * @param {number} angle Angle in radians.
 * @return {number} in the range [-Pi, Pi].
 */
Cesium.Math.negativePiToPi = function(angle) {};


/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
Cesium.Math.clamp = function(value, min, max) {};


/**
 * @param {number} angle The angle between the two points
 * @param {number} radius The radius of the circle
 * @return {number} the chord length
 */
Cesium.Math.chordLength = function(angle, radius) {};


/**
 * @type {number}
 */
Cesium.Math.PI;


/**
 * @type {number}
 */
Cesium.Math.PI_OVER_TWO;


/**
 * @type {number}
 */
Cesium.Math.PI_OVER_THREE;


/**
 * @type {number}
 */
Cesium.Math.PI_OVER_FOUR;


/**
 * @type {number}
 */
Cesium.Math.TWO_PI;


/**
 * @type {number}
 */
Cesium.Math.EPSILON2;


/**
 * @type {number}
 */
Cesium.Math.EPSILON3;


/**
 * @type {number}
 */
Cesium.Math.EPSILON4;


/**
 * @type {number}
 */
Cesium.Math.EPSILON5;


/**
 * @type {number}
 */
Cesium.Math.EPSILON6;


/**
 * @type {number}
 */
Cesium.Math.EPSILON7;


/**
 * @type {number}
 */
Cesium.Math.EPSILON8;


/**
 * @type {number}
 */
Cesium.Math.EPSILON9;


/**
 * @type {number}
 */
Cesium.Math.EPSILON10;


/**
 * @type {number}
 */
Cesium.Math.EPSILON11;


/**
 * @type {number}
 */
Cesium.Math.EPSILON12;


/**
 * @type {number}
 */
Cesium.Math.EPSILON13;


/**
 * @type {number}
 */
Cesium.Math.EPSILON14;


/**
 * @type {number}
 */
Cesium.Math.RADIANS_PER_DEGREE;


/**
 * @param {number} rad
 * @return {number} angle in degrees
 */
Cesium.Math.toDegrees = function(rad) {};


/**
 * @param {number} degrees
 * @return {number} angle in radians
 */
Cesium.Math.toRadians = function(degrees) {};


/**
 * @constructor
 */
Cesium.Matrix2 = function() {};


/**
 * @param {!Cesium.Matrix2} matrix
 * @param {!Cesium.Cartesian2} vector
 * @param {!Cesium.Cartesian2} result
 * @return {!Cesium.Cartesian2}
 */
Cesium.Matrix2.multiplyByVector = function(matrix, vector, result) {};


/**
 * @param {number} angle
 * @return {!Cesium.Matrix2}
 */
Cesium.Matrix2.fromRotation = function(angle) {};



/**
 * @constructor
 */
Cesium.Matrix3 = function() {};


/**
 * @param {Cesium.Quaternion} quaternion
 * @param {Cesium.Matrix3=} opt_result
 * @return {!Cesium.Matrix3}
 */
Cesium.Matrix3.fromQuaternion = function(quaternion, opt_result) {};


/**
 * @param {Cesium.Matrix3} matrix
 * @param {Cesium.Cartesian3} cartesian
 * @param {Cesium.Cartesian3} result
 * @return {Cesium.Cartesian3}
 */
Cesium.Matrix3.multiplyByVector = function(matrix, cartesian, result) {};



/**
 * @constructor
 * @param {number=} opt_a00 .
 * @param {number=} opt_a10 .
 * @param {number=} opt_a20 .
 * @param {number=} opt_a30 .
 * @param {number=} opt_a01 .
 * @param {number=} opt_a11 .
 * @param {number=} opt_a21 .
 * @param {number=} opt_a31 .
 * @param {number=} opt_a02 .
 * @param {number=} opt_a12 .
 * @param {number=} opt_a22 .
 * @param {number=} opt_a32 .
 * @param {number=} opt_a03 .
 * @param {number=} opt_a13 .
 * @param {number=} opt_a23 .
 * @param {number=} opt_a33 .
 */
Cesium.Matrix4 = function(opt_a00, opt_a10, opt_a20, opt_a30,
                          opt_a01, opt_a11, opt_a21, opt_a31,
                          opt_a02, opt_a12, opt_a22, opt_a32,
                          opt_a03, opt_a13, opt_a23, opt_a33) {};


/**
 * @type {Cesium.Matrix4}
 */
Cesium.Matrix4.IDENTITY;


/**
 * @param {Cesium.Matrix4} matrix
 * @param {Cesium.Matrix4=} opt_result
 * @return {!Cesium.Matrix4}
 */
Cesium.Matrix4.clone = function(matrix, opt_result) {};


/**
 * @param {Cesium.Cartesian3} translation .
 * @param {Cesium.Matrix4=} opt_result .
 * @return {!Cesium.Matrix4} .
 */
Cesium.Matrix4.fromTranslation = function(translation, opt_result) {};


/**
 * @param {Cesium.Matrix4} left .
 * @param {Cesium.Matrix4} right .
 * @param {Cesium.Matrix4} result .
 * @return {Cesium.Matrix4} .
 */
Cesium.Matrix4.multiply = function(left, right, result) {};


/**
 * @param {Cesium.Matrix4|undefined} matrix1
 * @param {Cesium.Matrix4|undefined} matrix2
 * @param {number} epsilon
 * @return {boolean}
 */
Cesium.Matrix4.equalsEpsilon = function(matrix1, matrix2, epsilon) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {boolean} .
 */
Cesium.Matrix4.prototype.equals = function(matrix) {};


/**
 * @param {Cesium.Matrix4} matrix
 * @param {number} epsilon
 * @return {boolean}
 */
Cesium.Matrix4.prototype.equalsEpsilon = function(matrix, epsilon) {};


/**
 * @param {Cesium.Matrix4=} opt_result
 * @return {Cesium.Matrix4}
 */
Cesium.Matrix4.prototype.clone = function(opt_result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian3} point .
 * @param {Cesium.Cartesian3} result .
 * @return {Cesium.Cartesian3} .
 */
Cesium.Matrix4.multiplyByPoint = function(matrix, point, result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @param {Cesium.Cartesian4} point .
 * @param {Cesium.Cartesian4} result .
 * @return {Cesium.Cartesian4} .
 */
Cesium.Matrix4.multiplyByVector = function(matrix, point, result) {};


/**
 * @param {Cesium.Matrix4} matrix .
 * @return {Array.<number>} .
 */
Cesium.Matrix4.toArray = function(matrix) {};



/**
 * @constructor
 */
Cesium.PerspectiveFrustrum = function() {};


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.aspectRatio;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.far;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.fovy;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.fov;


/**
 * @type {number}
 */
Cesium.PerspectiveFrustrum.prototype.near;


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.PerspectiveFrustrum.prototype.projectionMatrix;


/**
 * @param {!number} drawingBufferWidth
 * @param {!number} drawingBufferHeight
 * @param {!number} dist
 * @param {!Cesium.Cartesian2} result
 * @return {!Cesium.Cartesian2}
 */
Cesium.PerspectiveFrustrum.prototype.getPixelDimensions = function(drawingBufferWidth, drawingBufferHeight, dist,
    result) {};



/**
 * @constructor
 */
Cesium.Quaternion = function() {};


/**
 * @param {Cesium.Cartesian3} axis
 * @param {number} angle
 * @param {Cesium.Quaternion=} opt_result
 * @return {Cesium.Quaternion}
 */
Cesium.Quaternion.fromAxisAngle = function(axis, angle, opt_result) {};



/**
 * @constructor
 */
Cesium.Context = function() {};


/**
 * @type {!Cesium.UniformState}
 */
Cesium.Context.prototype.uniformState;


/**
 * @type {!Cesium.Color}
 */
Cesium.Context.prototype._nextPickColor;


/**
 * @type {Array<Object|undefined>}
 */
Cesium.Context.prototype._pickObjects;



/**
 * @constructor
 */
Cesium.Fog = function() {};


/**
 * @type {boolean}
 */
Cesium.Fog.prototype.enabled;


/**
 * @type {number}
 */
Cesium.Fog.prototype.density;


/**
 * @type {number}
 */
Cesium.Fog.prototype.screenSpaceErrorFactor;


/**
 * @typedef {{
 *   alpha: (boolean|undefined),
 *   antialias: (boolean|undefined),
 *   depth: (boolean|undefined),
 *   failIfMajorPerformanceCaveat: (boolean|undefined),
 *   premultipliedAlpha: (boolean|undefined),
 *   preserveDrawingBuffer: (boolean|undefined),
 *   stencil: (boolean|undefined)
 * }}
 */
Cesium.WebGLContextOptions;


/**
 * @typedef {{
 *   allowTextureFilterAnisotropic: (boolean|undefined),
 *   webgl: (Cesium.WebGLContextOptions|undefined)
 * }}
 */
Cesium.ContextOptions;


/**
 * @typedef {{
 *   canvas: HTMLCanvasElement,
 *   contextOptions: (Cesium.ContextOptions|undefined),
 *   creditContainer: (Element|undefined),
 *   mapProjection: (Object|undefined),
 *   scene3DOnly: (boolean|undefined)
 * }}
 */
Cesium.SceneOptions;



/**
 * @constructor
 * @param {Cesium.SceneOptions=} opt_opts
 */
Cesium.Scene = function(opt_opts) {};


/**
 * @type {!HTMLCanvasElement}
 */
Cesium.Scene.prototype.canvas;


/**
 * @type {!Cesium.Color}
 */
Cesium.Scene.prototype.backgroundColor;


/**
 * @type {!Cesium.Context}
 */
Cesium.Scene.prototype.context;


/**
 * @type {!Cesium.Fog}
 */
Cesium.Scene.prototype.fog;


/**
 */
Cesium.Scene.prototype.initializeFrame = function() {};


/**
 * @param {Cesium.JulianDate} julianDate
 */
Cesium.Scene.prototype.render = function(julianDate) {};


/**
 * @type {Cesium.Event}
 * @const
 */
Cesium.Scene.prototype.preRender;


/**
 * @type {Cesium.Event}
 * @const
 */
Cesium.Scene.prototype.postRender;


/**
 * @type {Cesium.ScreenSpaceCameraController}
 */
Cesium.Scene.prototype.screenSpaceCameraController;


/**
 * @type {Cesium.TerrainProvider}
 */
Cesium.Scene.prototype.terrainProvider;


/**
 *
 */
Cesium.Scene.prototype.destroy = function() {};


/**
 * @type {!Cesium.Camera}
 */
Cesium.Scene.prototype.camera;


/**
 * @type {Cesium.Globe}
 */
Cesium.Scene.prototype.globe;


/**
 * @type {!Cesium.ImageryLayerCollection}
 */
Cesium.Scene.prototype.imageryLayers;


/**
 * @type {Cesium.SceneMode}
 */
Cesium.Scene.prototype.mode;


/**
 * @type {!Cesium.PrimitiveCollection}
 */
Cesium.Scene.prototype.primitives;


/**
 * @type {Object}
 */
Cesium.Scene.prototype.scene2D;


/**
 * @type {Cesium.SkyBox}
 */
Cesium.Scene.prototype.skyBox;


/**
 * @type {Cesium.SkyAtmosphere}
 */
Cesium.Scene.prototype.skyAtmosphere;


/**
 * @type {number}
 */
Cesium.Scene.prototype.maximumAliasedLineWidth;



/**
 * @constructor
 */
Cesium.JulianDate = function() {};


/**
 * @return {Cesium.JulianDate}
 */
Cesium.JulianDate.now = function() {};


/**
 * @param {Date} d The date
 * @param {Cesium.JulianDate=} opt_result An optional result to use
 * @return {Cesium.JulianDate}
 */
Cesium.JulianDate.fromDate = function(d, opt_result) {};


/**
 * @constructor
 */
Cesium.DataSource = function() {};



/**
 * @constructor
 */
Cesium.DataSourceCollection = function() {};


/**
 * @param {Cesium.DataSource|Promise.<Cesium.DataSource>} dataSource A data source or a promise to a data source to add
 *                                                                   to the collection.
 * @return {Promise.<Cesium.DataSource>} A Promise that resolves once the data source has been added to the collection.
 */
Cesium.DataSourceCollection.prototype.add = function(dataSource) {};


/**
 * Removes a data source from this collection, if present.
 *
 * @param {Cesium.DataSource} dataSource The data source to remove.
 * @param {boolean} destroy Whether to destroy the data source in addition to removing it.
 * @return {boolean} true if the data source was in the collection and was removed,
 *                    false if the data source was not in the collection.
 */
Cesium.DataSourceCollection.prototype.remove = function(dataSource, destroy) {};



/**
 * @constructor
 * @param {{scene: Cesium.Scene,
            dataSourceCollection: Cesium.DataSourceCollection}=} opt_opts
 */
Cesium.DataSourceDisplay = function(opt_opts) {};


/**
 * @param {Cesium.JulianDate} time The simulation time.
 * @return {boolean} True if all data sources are ready to be displayed, false otherwise.
 */
Cesium.DataSourceDisplay.prototype.update = function(time) {};


/**
 * @type {Cesium.CustomDataSource}
 */
Cesium.DataSourceDisplay.prototype.defaultDataSource;


/**
 * @param {Cesium.Entity} entity
 * @param {boolean} allowPartial
 * @param {Cesium.BoundingSphere} boundingSphere
 * @return {Cesium.BoundingSphereState}
 */
Cesium.DataSourceDisplay.prototype.getBoundingSphere = function(entity, allowPartial, boundingSphere) {};



/**
 * @param {string} name
 * @constructor
 */
Cesium.CustomDataSource = function(name) {};


/**
 * @type {Cesium.EntityCollection}
 */
Cesium.CustomDataSource.prototype.entities;



/**
 * @constructor
 */
Cesium.EntityCollection = function() {};


/**
 * @type {!Cesium.UniformState}
 */
Cesium.Context.prototype.uniformState;


/**
 * @typedef {{
 *  primitive: Cesium.Primitive
 * }}
 */
Cesium.PickObject;


/**
 * @type {Cesium.Primitive}
 */
Cesium.PickObject.prototype.primitive;


/**
 * @param {!Cesium.Cartesian2} windowPosition
 * @return {Array.<Cesium.PickObject>}
 */
Cesium.Scene.prototype.drillPick = function(windowPosition) {};


/**
 * @param {!Cesium.Cartesian2} windowPosition
 * @return {Cesium.PickObject}
 */
Cesium.Scene.prototype.pick = function(windowPosition) {};


/**
 * @param {Cesium.Cartesian2} windowPosition
 * @param {Cesium.Cartesian3=} opt_result
 * @return {Cesium.Cartesian3}
 */
Cesium.Scene.prototype.pickPosition = function(windowPosition, opt_result) {};



/**
 * @constructor
 */
Cesium.SceneMode = function() {};


/**
 * @type {number}
 */
Cesium.SceneMode.COLUMBUS_VIEW;


/**
 * @type {number}
 */
Cesium.SceneMode.MORPHING;


/**
 * @type {number}
 */
Cesium.SceneMode.SCENE2D;


/**
 * @type {number}
 */
Cesium.SceneMode.SCENE3D;



/**
 * @constructor
 */
Cesium.SceneTransforms = function() {};


/**
 * @param {Cesium.Scene} scene
 * @param {Cesium.Cartesian3} position
 * @param {Cesium.Cartesian2=} opt_result
 * @return {Cesium.Cartesian2}
 */
Cesium.SceneTransforms.wgs84ToWindowCoordinates = function(scene, position, opt_result) {};



/**
 * @constructor
 */
Cesium.UniformState = function() {};


/**
 * @type {!Cesium.Matrix4}
 */
Cesium.UniformState.prototype.modelViewProjection;



/**
 * @constructor
 */
Cesium.ScreenSpaceCameraController = function() {};


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.maximumZoomDistance;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.minimumZoomDistance;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableRotate;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableLook;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableTilt;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableZoom;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableInputs;


/**
 * @type {boolean}
 */
Cesium.ScreenSpaceCameraController.prototype.enableCollisionDetection;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaSpin;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaTranslate;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.inertiaZoom;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.minimumPickingTerrainHeight;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.minimumCollisionTerrainHeight;


/**
 * @typedef {{
 *   eventType: !Cesium.CameraEventType,
 *   modifier: !Cesium.KeyboardEventModifier
 * }}
 */
Cesium.CameraEventObject;


/**
 * Helper typedef.
 * @typedef {Cesium.CameraEventObject|Cesium.CameraEventType}
 */
Cesium._SingleEventType;


/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.lookEventTypes;


/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.rotateEventTypes;


/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.tiltEventTypes;


/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.translateEventTypes;


/**
 * @type {Cesium._SingleEventType|Array.<Cesium._SingleEventType>|undefined}
 */
Cesium.ScreenSpaceCameraController.prototype.zoomEventTypes;


/**
 * @type {Cesium.CameraEventAggregator}
 */
Cesium.ScreenSpaceCameraController.prototype._aggregator;


/**
 * @type {Cesium.Scene}
 */
Cesium.ScreenSpaceCameraController.prototype._scene;


/**
 * @type {!Cesium.Ellipsoid}
 */
Cesium.ScreenSpaceCameraController.prototype._ellipsoid;


/**
 * @type {Cesium.Cartesian2}
 */
Cesium.ScreenSpaceCameraController.prototype._rotateMousePosition;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.ScreenSpaceCameraController.prototype._rotateStartPosition;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.ScreenSpaceCameraController.prototype._strafeStartPosition;


/**
 * @type {Cesium.Cartesian3}
 */
Cesium.ScreenSpaceCameraController.prototype._horizontalRotationAxis;


/**
 * @type {Cesium.Cartesian2}
 */
Cesium.ScreenSpaceCameraController.prototype._tiltCenter;


/**
 * @type {Cesium.Cartesian2}
 */
Cesium.ScreenSpaceCameraController.prototype._tiltCenterMousePosition;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype._minimumRotateRate;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype._maximumRotateRate;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype._zoomFactor;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.maximumMovementRatio;


/**
 * @type {number}
 */
Cesium.ScreenSpaceCameraController.prototype.minimumTrackBallHeight;


/**
 * @typedef {{position: Cesium.Cartesian2,
 *     endPosition: Cesium.Cartesian2}}
 */
Cesium.ScreenSpaceEventHandlerEvent;



/**
 * @constructor
 * @param {!Element} canvas .
 */
Cesium.ScreenSpaceEventHandler = function(canvas) {};


/**
 * @type {Array<Function>}
 */
Cesium.ScreenSpaceEventHandler.prototype._removalFunctions;


/**
 * @return {undefined}
 */
Cesium.ScreenSpaceEventHandler.prototype.destroy = function() {};


/**
 * @param {Cesium.ScreenSpaceEventType} type .
 * @param {Cesium.KeyboardEventModifier=} opt_modifier .
 */
Cesium.ScreenSpaceEventHandler.prototype.removeInputAction = function(type, opt_modifier) {};


/**
 * @param {function(Cesium.ScreenSpaceEventHandlerEvent)} callback .
 * @param {Cesium.ScreenSpaceEventType} type .
 * @param {Cesium.KeyboardEventModifier=} opt_modifier .
 */
Cesium.ScreenSpaceEventHandler.prototype.setInputAction = function(callback, type, opt_modifier) {};


/**
 * @param {Cesium.ScreenSpaceEventType} type .
 * @param {Cesium.KeyboardEventModifier=} opt_modifier .
 * @return {function(Cesium.ScreenSpaceEventHandlerEvent)}
 */
Cesium.ScreenSpaceEventHandler.prototype.getInputAction = function(type, opt_modifier) {};



/** @constructor */
Cesium.ScreenSpaceEventType = function() {};


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.LEFT_DOWN;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.LEFT_UP;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.RIGHT_DOWN;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.MIDDLE_DOWN;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.WHEEL;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.PINCH_START;


/**
 * @type {Cesium.ScreenSpaceEventType}
 */
Cesium.ScreenSpaceEventType.MOUSE_MOVE;



/**
 * @constructor
 * @extends {Cesium.ImageryProvider}
 * @param {Cesium.SingleTileImageryProviderOptions} options
 */
Cesium.SingleTileImageryProvider = function(options) {};


/**
 * @typedef {{url: string}}
 */
Cesium.SingleTileImageryProviderOptions;


/**
 * @type {Cesium.RemovedAPI}
 */
Cesium.TileMapServiceImageryProvider;



/**
 * @constructor
 */
Cesium.SkyAtmosphere = function() {};



/**
 * @constructor
 * @param {Cesium.SkyBoxOptions} options
 */
Cesium.SkyBox = function(options) {};


/**
 * @typedef {{
 *   positiveX: string,
 *   negativeX: string,
 *   positiveY: string,
 *   negativeY: string,
 *   positiveZ: string,
 *   negativeZ: string
 * }}
 */
Cesium.SkyBoxSources;


/**
 * @typedef {{
 *   sources: (Cesium.SkyBoxSources|undefined),
 *   show: (boolean|undefined)
 * }}
 */
Cesium.SkyBoxOptions;



/**
 * @constructor
 * @param {Cesium.Ellipsoid} ellipsoid
 */
Cesium.WebMercatorProjection = function(ellipsoid) {};


/**
 * @param {Cesium.Cartographic} cartographic
 * @return {Cesium.Cartesian3}
 */
Cesium.WebMercatorProjection.prototype.project = function(cartographic) {};


/**
 * @param {Cesium.Cartesian3} cartesian
 * @return {Cesium.Cartographic}
 */
Cesium.WebMercatorProjection.prototype.unproject = function(cartesian) {};



/** @constructor */
Cesium.BingMapsStyle = function() {};


/**
 * @type {!Cesium.BingMapsStyle}
 */
Cesium.BingMapsStyle.AERIAL;


/**
 * @type {!Cesium.BingMapsStyle}
 */
Cesium.BingMapsStyle.AERIAL_WITH_LABELS;


/**
 * @type {!Cesium.BingMapsStyle}
 */
Cesium.BingMapsStyle.ROAD;



/**
 * @constructor
 */
Cesium.IntersectionTests = function() {};


/**
 * @typedef {{
 *   start: number,
 *   stop: number
 * }}
 */
Cesium.StartEndObject;


/**
 * @param {!Cesium.Ray} ray
 * @param {Cesium.Ellipsoid} ellipsoid
 * @return {Cesium.StartEndObject}
 */
Cesium.IntersectionTests.rayEllipsoid = function(ray, ellipsoid) {};


/**
 * @param {!Cesium.Ray} ray
 * @param {!Cesium.Plane} plane
 * @param {Cesium.Cartesian3} result
 */
Cesium.IntersectionTests.rayPlane = function(ray, plane, result) {};


/**
 * @param {!Cesium.Ray} ray
 * @param {!Cesium.Ellipsoid} ellipsoid
 * @return {Cesium.Cartesian3}
 */
Cesium.IntersectionTests.grazingAltitudeLocation = function(ray, ellipsoid) {};


/**
 * @param {!Cesium.Ray} ray
 * @param {number} distance
 * @param {Cesium.Cartesian3=} opt_result
 * @return {!Cesium.Cartesian3}
 */
Cesium.Ray.getPoint = function(ray, distance, opt_result) {};



/**
 * @constructor
 */
Cesium.HeightReference = function() {};


/**
 * @type {!Cesium.HeightReference}
 * @const
 */
Cesium.HeightReference.CLAMP_TO_GROUND;


/**
 * @type {!Cesium.HeightReference}
 * @const
 */
Cesium.HeightReference.NONE;


/**
 * @type {!Cesium.HeightReference}
 * @const
 */
Cesium.HeightReference.RELATIVE_TO_GROUND;



/**
 * @constructor
 */
Cesium.TerrainProvider = function() {};


/**
 * @type {Cesium.Credit}
 */
Cesium.TerrainProvider.prototype.credit;


/**
 * @type {Cesium.Event}
 */
Cesium.TerrainProvider.prototype.errorEvent;


/**
 * @type {boolean}
 */
Cesium.TerrainProvider.prototype.hasVertexNormals;


/**
 * @type {boolean}
 */
Cesium.TerrainProvider.prototype.hasWaterMask;


/**
 * @type {boolean}
 */
Cesium.TerrainProvider.prototype.ready;


/**
 * @type {Cesium.TilingScheme}
 */
Cesium.TerrainProvider.prototype.tilingScheme;


/**
 * @param {number} level
 * @return {number}
 */
Cesium.TerrainProvider.prototype.getLevelMaximumGeometricError = function(level) {};


/**
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @return {boolean}
 */
Cesium.TerrainProvider.prototype.getTileDataAvailable = function(x, y, level) {};


/**
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @param {boolean} throttleRequests
 * @return {Cesium.Promise|Cesium.TerrainData|undefined}
 */
Cesium.TerrainProvider.prototype.requestTileGeometry = function(x, y, level, throttleRequests) {};


/**
 * @param {Cesium.Ellipsoid} ellipsoid
 * @param {number} tileImageWidth
 * @param {number} numberOfTilesAtLevelZero
 * @return {number}
 */
Cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap =
    function(ellipsoid, tileImageWidth, numberOfTilesAtLevelZero) {};


/**
 * @typedef {{
 *   url: string,
 *   credit: (Cesium.Credit|string|undefined),
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   proxy: (Object|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   token: (string|undefined)
 * }}
 */
Cesium.ArcGisImageServerTerrainProviderOptions;



/**
 * @param {!Cesium.ArcGisImageServerTerrainProviderOptions} options
 * @extends {Cesium.TerrainProvider}
 * @constructor
 */
Cesium.ArcGisImageServerTerrainProvider = function(options) {};


/**
 * @typedef {{
 *   url: string,
 *   credit: (Cesium.Credit|string|undefined),
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   proxy: (Object|undefined),
 *   requestVertexNormals: (boolean|undefined),
 *   requestWaterMask: (boolean|undefined)
 * }}
 */
Cesium.CesiumTerrainProviderOptions;



/**
 * @param {!Cesium.CesiumTerrainProviderOptions} options
 * @extends {Cesium.TerrainProvider}
 * @constructor
 */
Cesium.CesiumTerrainProvider = function(options) {};


/**
 * @typedef {{
 *   ellipsoid: (Cesium.Ellipsoid|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined)
 * }}
 */
Cesium.EllipsoidTerrainProviderOptions;



/**
 * @param {Cesium.EllipsoidTerrainProviderOptions=} opt_options
 * @extends {Cesium.TerrainProvider}
 * @constructor
 */
Cesium.EllipsoidTerrainProvider = function(opt_options) {};


/**
 * @typedef {{
 *   heightScale: (number|undefined),
 *   heightOffset: (number|undefined),
 *   elementsPerHeight: (number|undefined),
 *   stride: (number|undefined),
 *   elementMultiplier: (number|undefined),
 *   isBigEndian: (boolean|undefined)
 * }}
 */
Cesium.HeightMapStructure;



/**
 * @constructor
 */
Cesium.TerrainData = function() {};


/**
 * @typedef {{
 *   buffer: (Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array),
 *   width: number,
 *   height: number,
 *   childTileMask: (number|undefined),
 *   structure: (Cesium.HeightMapStructure|undefined),
 *   createdByUpsampling: (boolean|undefined)
 * }}
 */
Cesium.HeightmapTerrainDataOptions;



/**
 * @param {!Cesium.HeightmapTerrainDataOptions} options
 * @extends {Cesium.TerrainData}
 * @constructor
 */
Cesium.HeightmapTerrainData = function(options) {};



/**
 * @constructor
 * @param {Cesium.Cartesian3} normal
 * @param {number} distance
 */
Cesium.Plane = function(normal, distance) {};


/**
 * @param {Cesium.Cartesian3} point
 * @param {Cesium.Cartesian3} normal
 * @param {Cesium.Plane} result
 */
Cesium.Plane.fromPointNormal = function(point, normal, result) {};



/**
 * @param {!Cesium.WebMapTileServiceImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 * @constructor
 */
Cesium.WebMapTileServiceImageryProvider = function(options) {};


/**
 * @typedef {{
 *   url: string,
 *   format: string,
 *   layer: string,
 *   style: string,
 *   tileMatrixSetID: string,
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   proxy: (Object|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   subdomains: (string|Array.<string>|undefined)
 * }}
 */
Cesium.WebMapTileServiceImageryProviderOptions;



/**
 * @param {!Cesium.UrlTemplateImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 * @constructor
 */
Cesium.UrlTemplateImageryProvider = function(options) {};


/**
 * @typedef {{
 *   url: string,
 *   subdomains: (string|Array.<string>|undefined),
 *   proxy: (Object|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   hasAlphaChannel: (boolean|undefined)
 * }}
 */
Cesium.UrlTemplateImageryProviderOptions;


/**
 * @typedef {{
 *   url: string,
 *   layers: string,
 *   parameters: (Object|undefined),
 *   rectangle: (Cesium.Rectangle|undefined),
 *   tilingScheme: (Cesium.TilingScheme|undefined),
 *   tileWidth: (number|undefined),
 *   tileHeight: (number|undefined),
 *   minimumLevel: (number|undefined),
 *   maximumLevel: (number|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   proxy: (Object|undefined),
 *   subdomains: (string|Array.<string>|undefined)
 * }}
 */
Cesium.WebMapServiceImageryProviderOptions;



/**
 * @constructor
 * @param {Cesium.WebMapServiceImageryProviderOptions} options
 * @extends {Cesium.ImageryProvider}
 */
Cesium.WebMapServiceImageryProvider = function(options) {};


/**
 * @type {function(Object=)}
 */
Cesium.loadWithXhr;


/**
 * @type {function(...)}
 */
Cesium.loadWithXhr.load;



/**
 * @param {string} workerName
 * @param {number=} opt_maximumActiveTasks
 * @constructor
 */
Cesium.TaskProcessor = function(workerName, opt_maximumActiveTasks) {};


/**
 * @return {boolean}
 */
Cesium.TaskProcessor.prototype.isDestroyed = function() {};



/**
 * @constructor
 */
Cesium.EventHelper = function() {};


/**
 * @param {Cesium.Event} event
 * @param {function()} listener
 * @param {Object=} opt_scope
 * @return {function()}
 */
Cesium.EventHelper.prototype.add = function(event, listener, opt_scope) {};


/**
 *
 */
Cesium.EventHelper.prototype.removeAll = function() {};



/**
 * @constructor
 * @param {Cesium.Cartesian3=} opt_center The center
 * @param {number=} opt_radius The radius
 */
Cesium.BoundingSphere = function(opt_center, opt_radius) {};


/**
 * @enum {number}
 */
Cesium.BoundingSphereState = {
  DONE: 0,
  PENDING: 1,
  FAILED: 2
};



/**
 * @param {Object} options
 * @constructor
 */
Cesium.Entity = function(options) {};



/**
 * @param {Cesium.Entity} entity
 * @param {Cesium.Scene} scene
 * @param {Cesium.Ellipsoid} ellipsoid
 * @constructor
 */
Cesium.EntityView = function(entity, scene, ellipsoid) {};


/**
 * @param {Cesium.JulianDate} currentTime
 * @param {!Cesium.BoundingSphere|undefined} bs
 */
Cesium.EntityView.prototype.update = function(currentTime, bs) {};



/**
 * @param {function(Cesium.JulianDate, Object)} cb
 * @param {boolean} constant
 * @constructor
 */
Cesium.CallbackProperty = function(cb, constant) {};
