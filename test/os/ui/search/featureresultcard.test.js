goog.require('goog.events.EventType');
goog.require('os.MapContainer');
goog.require('os.layer.Vector');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.style.StyleType');
goog.require('os.ui.search.FeatureResultCardCtrl');
goog.require('os.ui.search.place.CoordinateResult');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.ui.search.FeatureResultCardCtrl', () => {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: StyleType} = goog.module.get('os.style.StyleType');
  const {default: Controller} = goog.module.get('os.ui.search.FeatureResultCardCtrl');
  const {default: CoordinateResult} = goog.module.get('os.ui.search.place.CoordinateResult');

  let controller;
  let scope;
  let element;

  let layer;
  let source;
  let feature;
  let result;

  const featureId = 'test-id';

  // Load the Angular module
  beforeEach(angular.mock.module('app'));

  beforeEach(inject(($compile, $rootScope) => {
    feature = new Feature({
      field1: 'value1',
      field2: 'value2'
    });
    feature.setId(featureId);

    result = new CoordinateResult(feature);

    source = new VectorSource();
    layer = new VectorLayer({source});

    spyOn(MapContainer, 'getInstance').andReturn({
      getLayer: (id) => layer,
      removeLayer: () => {},
      is3DSupported: () => false
    });

    scope = $rootScope.$new(true);
    scope.result = result;

    element = angular.element('<div></div>');
    $compile(element)(scope);
    scope.$apply();

    controller = new Controller(scope, element);
  }));

  afterEach(() => {
    scope.$destroy();
    controller.dispose();
  });

  it('initializes the controller and adds the feature to the search layer', () => {
    expect(controller.result).toBe(result);
    expect(controller.feature).toBe(feature);
    expect(controller.layer).toBe(layer);

    expect(source.getFeatureById(featureId)).toBe(feature);
  });

  it('cleans up the controller on dispose', () => {
    controller.dispose();

    expect(controller.feature).toBeNull();
    expect(controller.scope).toBeNull();
    expect(controller.element).toBeNull();

    expect(source.getFeatureById(featureId)).toBeNull();
  });

  it('adds and removes highlight on a feature', () => {
    const highlightColor = 'rgba(255,0,255,.5)';
    controller.highlightConfig = {
      fill: {
        color: highlightColor
      }
    };

    expect(feature.get(StyleType.HIGHLIGHT)).toBeUndefined();

    controller.addFeatureHighlight();
    expect(feature.get(StyleType.HIGHLIGHT)).toBe(controller.highlightConfig);

    let featureStyle = feature.getStyle()[0];
    expect(featureStyle.getFill().getColor()).toBe(highlightColor);

    controller.removeFeatureHighlight();
    expect(feature.get(StyleType.HIGHLIGHT)).toBeUndefined();

    featureStyle = feature.getStyle()[0];
    expect(featureStyle.getFill()).toBeNull();
    expect(featureStyle.getImage()).toBeDefined();
  });

  it('sets card highlight state', () => {
    expect(element.hasClass('u-card-highlight')).toBe(false);

    controller.setCardHighlighted(true);
    expect(element.hasClass('u-card-highlight')).toBe(true);

    controller.setCardHighlighted(false);
    expect(element.hasClass('u-card-highlight')).toBe(false);
  });

  it('sets card selected state', () => {
    expect(element.hasClass('u-card-selected')).toBe(false);

    controller.setCardSelected(true);
    expect(element.hasClass('u-card-selected')).toBe(true);

    controller.setCardSelected(false);
    expect(element.hasClass('u-card-selected')).toBe(false);
  });

  it('handles highlight events from the source', () => {
    const feature2 = new Feature();
    feature2.setId('feature2');

    // Add another test feature and clear the process queue.
    source.addFeature(feature2);
    source.processNow();

    expect(element.hasClass('u-card-highlight')).toBe(false);

    source.setHighlightedItems([feature]);
    expect(element.hasClass('u-card-highlight')).toBe(true);

    source.setHighlightedItems([feature2]);
    expect(element.hasClass('u-card-highlight')).toBe(false);

    source.setHighlightedItems([feature2, feature]);
    expect(element.hasClass('u-card-highlight')).toBe(true);

    source.setHighlightedItems([]);
    expect(element.hasClass('u-card-highlight')).toBe(false);
  });

  it('handles selection events from the source', () => {
    const feature2 = new Feature();
    feature2.setId('feature2');

    // Add another test feature and clear the process queue.
    source.addFeature(feature2);
    source.processNow();

    expect(element.hasClass('u-card-selected')).toBe(false);

    source.addToSelected([feature]);
    expect(element.hasClass('u-card-selected')).toBe(true);

    source.removeFromSelected([feature]);
    expect(element.hasClass('u-card-selected')).toBe(false);

    source.setSelectedItems([feature2]);
    expect(element.hasClass('u-card-selected')).toBe(false);

    source.invertSelection();
    expect(element.hasClass('u-card-selected')).toBe(true);

    source.selectNone();
    expect(element.hasClass('u-card-selected')).toBe(false);
  });

  it('gets a field from the feature', () => {
    expect(controller.getField('field1')).toBe('value1');
    expect(controller.getField('field2')).toBe('value2');
    expect(controller.getField('field3')).toBeUndefined();
  });

  it('performs the result action on go to', () => {
    spyOn(result, 'performAction');

    controller.goTo();
    expect(result.performAction).toHaveBeenCalled();
  });

  it('highlights the feature on mouse over', () => {
    controller.over();
    expect(feature.get(StyleType.HIGHLIGHT)).toBe(controller.highlightConfig);

    controller.out();
    expect(feature.get(StyleType.HIGHLIGHT)).toBeUndefined();
  });

  it('tests if the feature has a coordinate', () => {
    expect(controller.hasCoordinate()).toBe(false);

    feature.setGeometry(new Point([10, 10]));
    expect(controller.hasCoordinate()).toBe(true);
  });
});
