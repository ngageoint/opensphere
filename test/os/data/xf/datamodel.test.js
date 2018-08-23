goog.require('goog.object');
goog.require('os.data.xf.DataModel');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


/**
 * @type {Array.<Object>}
 * @const
 */
var MOVIE_DATA = [
  {title: 'Casablanca',        year: 1941, rating: 8.5, lead: 'Bogart', gross: 1024560},
  {title: 'Braveheart',        year: 1995, rating: 8.4, lead: 'Gibson'},
  {title: 'Godfather',         year: 1972, rating: 9.2, lead: 'Pacino'},
  {title: 'Shaun of the Dead', year: 2004, rating: 7.9},
  {title: 'Pulp Fiction',      year: 1994, rating: 8.9},
  {title: 'Tombstone',         year: 1993, rating: 7.8, lead: 'Russell'},
  {title: 'Jaws',              year: 1975, rating: 8.0},
];

describe('os.data.xf.DataModel', function() {
  var data = [];
  for (var i = 0; i <= 99; i++) {
    var val = null;

    if (i % 2 == 1) {
      val = i + '';
    } else {
      val = i;
    }

    data.push({ id: i, value: val });
  }

  var numObjects = data.length;

  var dim1 = function(item) {
    return goog.isString(item.value);
  };

  var dim2 = function(item) {
    return goog.isNumber(item.value);
  };

  var filter = null;
  beforeEach(function() {
    if (filter) {
      filter.dispose();
    }

    filter = new os.data.xf.DataModel();
  });

  it('should initialize properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(goog.object.getCount(filter.dimensions)).toBe(0);
  });

  it('should add dimensions properly', function() {
    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    expect(goog.object.getCount(filter.dimensions)).toBe(2);
  });

  it('should add objects with time instants to the filter', function() {
    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(data.length);
  });

  it('should get results properly', function() {
    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    filter.add(data);

    filter.filterDimension('string', true);
    filter.filterDimension('number', false);

    var results = filter.getResults();
    expect(results.length).toBe(50);
    expect(goog.isString(results[0].value)).toBe(true);

    filter.filterDimension('string', false);
    filter.filterDimension('number', true);

    var results = filter.getResults(25);
    expect(results.length).toBe(25);
    expect(goog.isNumber(results[0].value)).toBe(true);
  });

  it('should filter objects after finding the intersection', function() {
    var filterFunction = function(item, index, array) {
      return index % 2 == 1;
    };

    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    filter.add(data);
    filter.setFilterFunction(filterFunction);
    filter.filterDimension('string', true);
    filter.filterDimension('number', false);

    results = filter.getResults();
    expect(results.length).toBe(numObjects / 4);
  });

  it('should clear properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);

    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(numObjects);

    filter.clear();
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);
  });

  it('should dispose properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);

    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(numObjects);

    filter.dispose();
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf).toBeNull();
  });

  //Max
  it('should get the dimension top record attribute value properly' , function() {
    filter.add(MOVIE_DATA);

    //Example: Max Value of string
    filter.addDimension('string_title', function(m) {return m.title});
    expect(filter.getTopAttributeValue('string_title', 'title')).toBe('Tombstone');
    expect(filter.getTopAttributeValue('string_title', 'rating')).toBe(7.8);

    //Example: Max value of number
    filter.addDimension('number_year', function(m) {return m.year});
    expect(filter.getTopAttributeValue('number_year', 'year')).toBe(2004);

    //Example: Max value with filtering
    //NOTE: crossfilter does not handle NaN, null, undefined well so an attribute cannot be missing
    //      for a record.  This can be handled when the dimension is added.
    filter.addDimension('string_lead', function(m) {return m.lead || ""});
    expect(filter.getTopAttributeValue('string_lead', 'lead')).toBe('Russell');
    filter.filterDimension('string_lead', 'Pacino');
    //The value returned respects the dimensions's filter
    expect(filter.getTopAttributeValue('string_lead', 'lead')).toBe('Pacino');
    filter.filterDimension('string_lead');
    //The value returned also respects the filters in other dimensions
    filter.filterDimension('number_year', 2004);
    expect(filter.getTopAttributeValue('string_lead', 'lead')).toBe(undefined);
    filter.filterDimension('number_year');

    //Example: Max value with numeric data not fully populated
    //NOTE: crossfilter does not handle NaN, null, undefined well so an attribute cannot be missing
    //      for a record.  This can be handled when the dimension is added.
    filter.addDimension('number_gross', function(m) {return m.gross || -Number.MAX_VALUE});
    expect(filter.getTopAttributeValue('number_gross', 'gross')).toBe(1024560);
  });

  //Min
  it('should get the dimension bottom record attribute value properly' , function() {
    filter.add(MOVIE_DATA);

    //Example: Min Value of string
    filter.addDimension('string_title', function(m) {return m.title});
    expect(filter.getBottomAttributeValue('string_title', 'title')).toBe('Braveheart');
    expect(filter.getBottomAttributeValue('string_title', 'rating')).toBe(8.4);

    //Example: Min value of number
    filter.addDimension('number_year', function(m) {return m.year});
    expect(filter.getBottomAttributeValue('number_year', 'year')).toBe(1941);

    //Example: Min value with filtering
    //NOTE: crossfilter does not handle NaN, null, undefined well so an attribute cannot be missing
    //      for a record.  This can be handled when the dimension is added.
    filter.addDimension('string_lead', function(m) {return m.lead || ""});
    expect(filter.getBottomAttributeValue('string_lead', 'lead')).toBe(undefined);
    //If we want to get the min of the leads that are defined, we need to filter out the empties
    filter.filterDimension('string_lead', function(l) {return l != ""});
    expect(filter.getBottomAttributeValue('string_lead', 'lead')).toBe('Bogart');
    filter.filterDimension('string_lead');

    //Example: Min value with numeric data not fully populated
    //NOTE: crossfilter does not handle NaN, null, undefined well so an attribute cannot be missing
    //      for a record.  This can be handled when the dimension is added.
    filter.addDimension('number_gross', function(m) {return m.gross || Number.MAX_VALUE});
    expect(filter.getBottomAttributeValue('number_gross', 'gross')).toBe(1024560);
  });
});
