/**
 * @externs
 */
var jsts = {};


/**
 * @constructor
 * @template T
 */
jsts.Collection = function() {};


/**
 * @return {jsts.Iterator<T>}
 */
jsts.Collection.prototype.iterator = function() {};


/**
 * @return {number}
 */
jsts.Collection.prototype.size = function() {};


/**
 * @constructor
 * @template T
 */
jsts.Iterator = function() {};


/**
 * @return {boolean}
 */
jsts.Iterator.prototype.hasNext = function() {};


/**
 * @return {T}
 */
jsts.Iterator.prototype.next = function() {};


/**
 * Namespace.
 * @type {Object}
 */
jsts.geom = {};



/**
 * @param {number|undefined} x
 * @param {number|undefined} y
 * @param {number|undefined} z
 * @constructor
 */
jsts.geom.Coordinate = function(x, y, z) {};


/**
 * @type {number|undefined}
 */
jsts.geom.Coordinate.prototype.x;


/**
 * @type {number|undefined}
 */
jsts.geom.Coordinate.prototype.y;


/**
 * @type {number|undefined}
 */
jsts.geom.Coordinate.prototype.z;


/**
 * @param {jsts.geom.Coordinate} other
 * @param {number=} opt_tolerance
 * @return {boolean}
 */
jsts.geom.Coordinate.prototype.equals2D = function(other, opt_tolerance) {};



/**
 * @constructor
 */
jsts.geom.Geometry = function() {};


/**
 * @type {number}
 * @const
 */
jsts.geom.Geometry.prototype.nVert;


/**
 * @type {Array<number>}
 * @const
 */
jsts.geom.Geometry.prototype.vertX;


/**
 * @type {Array<number>}
 * @const
 */
jsts.geom.Geometry.prototype.vertY;


/**
 * @return {string}
 */
jsts.geom.Geometry.prototype.getGeometryType = function() {};


/**
 * @return {jsts.geom.GeometryFactory}
 */
jsts.geom.Geometry.prototype.getFactory = function() {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.contains = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.coveredBy = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.covers = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.crosses = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {jsts.geom.Geometry}
 */
jsts.geom.Geometry.prototype.difference = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.disjoint = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {number}
 */
jsts.geom.Geometry.prototype.distance = function(g) {};


/**
 * @param {Object} o
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.equals = function(o) {};


/**
 * @return {jsts.geom.Coordinate}
 */
jsts.geom.Geometry.prototype.getCoordinate = function() {};


/**
 * @return {Array<jsts.geom.Coordinate>}
 */
jsts.geom.Geometry.prototype.getCoordinates = function() {};


/**
 * @return {number}
 */
jsts.geom.Geometry.prototype.getLength = function() {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.intersects = function(g) {};


/**
 * @param {jsts.geom.Geometry=} opt_g
 * @return {jsts.geom.Geometry}
 */
jsts.geom.Geometry.prototype.intersection = function(opt_g) {};


/**
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.isEmpty = function() {};


/**
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.isValid = function() {};


/**
 * @param {jsts.geom.Geometry} geom
 * @param {number} distance
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.isWithinDistance = function(geom, distance) {};


/**
 *
 */
jsts.geom.Geometry.prototype.normalize = function() {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.overlaps = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {jsts.geom.Geometry}
 */
jsts.geom.Geometry.prototype.symDifference = function(g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.touches = function(g) {};


/**
 * @param {jsts.geom.Geometry=} opt_g
 * @return {jsts.geom.Geometry}
 */
jsts.geom.Geometry.prototype.union = function(opt_g) {};


/**
 * @param {jsts.geom.Geometry} g
 * @return {boolean}
 */
jsts.geom.Geometry.prototype.within = function(g) {};



/**
 * @param {Object=} opt_precisionModel
 * @param {Object=} opt_coordinateSequenceFactory
 * @constructor
 */
jsts.geom.GeometryFactory = function(opt_precisionModel, opt_coordinateSequenceFactory) {};


/**
 * @param {jsts.geom.Coordinate} coordinate
 * @return {jsts.geom.Point}
 */
jsts.geom.GeometryFactory.prototype.createPoint = function(coordinate) {};


/**
 * @param {Array<jsts.geom.Coordinate>} coordinates
 * @return {jsts.geom.LineString}
 */
jsts.geom.GeometryFactory.prototype.createLineString = function(coordinates) {};


/**
 * @param {Array<jsts.geom.Coordinate>} coordinates
 * @return {jsts.geom.LinearRing}
 */
jsts.geom.GeometryFactory.prototype.createLinearRing = function(coordinates) {};


/**
 * @param {jsts.geom.LinearRing} shell
 * @param {Array<jsts.geom.LinearRing>} holes
 * @return {jsts.geom.Polygon}
 */
jsts.geom.GeometryFactory.prototype.createPolygon = function(shell, holes) {};


/**
 * @param {Array<jsts.geom.Coordinate>} points
 * @return {jsts.geom.MultiPoint}
 */
jsts.geom.GeometryFactory.prototype.createMultiPoint = function(points) {};


/**
 * @param {Array<jsts.geom.LineString>} lineStrings
 * @return {jsts.geom.MultiLineString}
 */
jsts.geom.GeometryFactory.prototype.createMultiLineString = function(lineStrings) {};


/**
 * @param {Array<jsts.geom.Polygon>} polygons
 * @return {jsts.geom.MultiPolygon}
 */
jsts.geom.GeometryFactory.prototype.createMultiPolygon = function(polygons) {};


/**
 * @param {Array<jsts.geom.Geometry>} geometries
 * @return {jsts.geom.GeometryCollection}
 */
jsts.geom.GeometryFactory.prototype.createGeometryCollection = function(geometries) {};



/**
 * @param {Array<T>} geometries
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.Geometry}
 * @template T
 */
jsts.geom.GeometryCollection = function(geometries, opt_factory) {};


/**
 * @return {number}
 */
jsts.geom.GeometryCollection.prototype.getNumGeometries = function() {};


/**
 * @param {number} n
 * @return {T}
 */
jsts.geom.GeometryCollection.prototype.getGeometryN = function(n) {};



/**
 * @param {jsts.geom.Coordinate=} opt_coordinate
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.Geometry}
 */
jsts.geom.Point = function(opt_coordinate, opt_factory) {};



/**
 * @param {Array<jsts.geom.Coordinate>} points
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.Geometry}
 */
jsts.geom.LineString = function(points, opt_factory) {};


/**
 * @param {number} n
 * @return {jsts.geom.Coordinate}
 */
jsts.geom.LineString.prototype.getCoordinateN = function(n) {};


/**
 * @return {number}
 */
jsts.geom.LineString.prototype.getNumPoints = function() {};


/**
 * @return {boolean}
 */
jsts.geom.LineString.prototype.isClosed = function() {};



/**
 * @param {Array<jsts.geom.Coordinate>} points
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.Geometry}
 */
jsts.geom.LinearRing = function(points, opt_factory) {};


/**
 * @param {jsts.geom.LinearRing} shell
 * @param {Array<jsts.geom.LinearRing>} holes
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.Geometry}
 */
jsts.geom.Polygon = function(shell, holes, opt_factory) {};


/**
 * @type {Array<jsts.geom.LinearRing>}
 */
jsts.geom.Polygon.prototype.holes;


/**
 * @type {jsts.geom.LinearRing}
 */
jsts.geom.Polygon.prototype.shell;


/**
 * @return {jsts.geom.LineString}
 */
jsts.geom.Polygon.prototype.getExteriorRing = function() {};


/**
 * @param {number} n
 * @return {jsts.geom.LineString}
 */
jsts.geom.Polygon.prototype.getInteriorRingN = function(n) {};


/**
 * @return {number}
 */
jsts.geom.Polygon.prototype.getNumInteriorRing = function() {};



/**
 * @param {Array<jsts.geom.Coordinate>} geometries
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.GeometryCollection<jsts.geom.Coordinate>}
 */
jsts.geom.MultiPoint = function(geometries, opt_factory) {};



/**
 * @param {Array<jsts.geom.LineString>} geometries
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.GeometryCollection<jsts.geom.LineString>}
 */
jsts.geom.MultiLineString = function(geometries, opt_factory) {};



/**
 * @param {Array<jsts.geom.Polygon>} geometries
 * @param {jsts.geom.GeometryFactory=} opt_factory
 * @constructor
 * @extends {jsts.geom.GeometryCollection<jsts.geom.Polygon>}
 */
jsts.geom.MultiPolygon = function(geometries, opt_factory) {};


/**
 * Namespace.
 * @type {Object}
 */
jsts.simplify = {};



/**
 * @constructor
 */
jsts.simplify.DouglasPeuckerSimplifier = function() {};


/**
 * @param {T} geometry
 * @param {number} threshold
 * @return {T}
 * @template T
 */
jsts.simplify.DouglasPeuckerSimplifier.simplify = function(geometry, threshold) {};


/**
 * Namespace.
 * @type {Object}
 */
jsts.operation = {};


/**
 * Namespace.
 * @type {Object}
 */
jsts.operation.buffer = {};



/**
 * @constructor
 */
jsts.operation.buffer.BufferOp = function() {};


/**
 * @param {T} geometry
 * @param {number} distance
 * @return {T}
 * @template T
 */
jsts.operation.buffer.BufferOp.bufferOp = function(geometry, distance) {};


/**
 * Namespace.
 * @type {Object}
 */
jsts.operation.polygonize = {};


/**
 * @constructor
 */
jsts.operation.polygonize.Polygonizer = function() {};


/**
 * @param {jsts.geom.Geometry|jsts.Collection<jsts.geom.Geometry>} g
 */
jsts.operation.polygonize.Polygonizer.prototype.add = function(g) {};


/**
 * @return {jsts.Collection<jsts.geom.Polygon>}
 */
jsts.operation.polygonize.Polygonizer.prototype.getPolygons = function() {};
