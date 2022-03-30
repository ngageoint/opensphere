goog.require('goog.array');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('os.net');
goog.require('os.net.CrossOrigin');
goog.require('os.net.Request');
goog.require('os.ogc.wmts.WMTSLayerParserV100');
goog.require('os.ui.ogc.OGCDescriptor');

import WMTSCapabilities from 'ol/src/format/WMTSCapabilities.js';

describe('os.ogc.wmts.WMTSLayerParserV100', () => {
  const {equals: arrayEquals} = goog.module.get('goog.array');
  const {loadXml} = goog.module.get('goog.dom.xml');
  const {isEmpty: isObjectEmpty} = goog.module.get('goog.object');
  const {registerCrossOrigin} = goog.module.get('os.net');
  const {default: CrossOrigin} = goog.module.get('os.net.CrossOrigin');
  const {default: Request} = goog.module.get('os.net.Request');
  const {default: WMTSLayerParserV100} = goog.module.get('os.ogc.wmts.WMTSLayerParserV100');
  const {default: OGCDescriptor} = goog.module.get('os.ui.ogc.OGCDescriptor');

  let capabilities = undefined;

  beforeEach(() => {
    runs(() => {
      capabilities = undefined;

      const request = new Request('/base/test/resources/ogc/wmts-100.xml');
      request.getPromise().then((response) => {
        capabilities = /** @type {Object} */ (new WMTSCapabilities().read(loadXml(response)));
      }, () => {
        throw new Error('Failed loading WMTS capabilities!');
      });
    });

    waitsFor(() => !!capabilities, 'WMTS capabilities to load');
  });

  it('initializes the parser', () => {
    const parser = new WMTSLayerParserV100();
    expect(isObjectEmpty(parser.tileMatrixSets)).toBe(true);

    parser.initialize(capabilities);

    expect(isObjectEmpty(parser.tileMatrixSets)).toBe(false);
    expect(parser.tileMatrixSets['GLOBAL_WEBMERCATOR']).toBe(true);
    expect(parser.tileMatrixSets['GLOBAL_PLATECARREE']).toBe(true);
  });

  it('parses a layer and updates a descriptor', () => {
    // Verify the cross origin is properly set. Both patterns match the URL, but the second is higher priority.
    registerCrossOrigin(/^https:\/\//, CrossOrigin.USE_CREDENTIALS);
    registerCrossOrigin(/^https:\/\/wmts\.example\.com\/ows/, CrossOrigin.ANONYMOUS, 1000);

    const expectedBbox3857 = [-180, -85.0511287798066, 180, 85.05112877980659];
    const expectedBbox4326 = [-180, -90, 180, 90];

    const parser = new WMTSLayerParserV100();
    parser.initialize(capabilities);

    const layers = capabilities['Contents']['Layer'];

    let layer;
    let descriptor;
    let wmtsOptions;

    layer = layers[0];
    descriptor = new OGCDescriptor();
    parser.parseLayer(capabilities, layer, descriptor);

    expect(descriptor.getTitle()).toBe('WMTS 3857 Layer 1');
    expect(descriptor.getDescription()).toBe('Description of WMTS 3857 Layer 1.');
    expect(descriptor.getWmtsDateFormat()).toBeNull();
    expect(descriptor.getWmtsTimeFormat()).toBeNull();
    expect(arrayEquals(descriptor.getBBox(), expectedBbox3857)).toBe(true);

    wmtsOptions = descriptor.getWmtsOptions();
    expect(wmtsOptions.length).toBe(1);
    expect(wmtsOptions[0].layer).toBe('test-3857-1');
    expect(wmtsOptions[0].matrixSet).toBe('GLOBAL_WEBMERCATOR');
    expect(wmtsOptions[0].crossOrigin).toBe('anonymous');
    expect(wmtsOptions[0].projection.getCode()).toBe('EPSG:3857');

    layer = layers[1];
    descriptor = new OGCDescriptor();
    parser.parseLayer(capabilities, layer, descriptor);

    expect(descriptor.getTitle()).toBe('WMTS 3857 Layer 2');
    expect(descriptor.getDescription()).toBeNull();
    expect(descriptor.getWmtsDateFormat()).toBeNull();
    expect(descriptor.getWmtsTimeFormat()).toBeNull();
    expect(arrayEquals(descriptor.getBBox(), expectedBbox3857)).toBe(true);

    wmtsOptions = descriptor.getWmtsOptions();
    expect(wmtsOptions.length).toBe(1);
    expect(wmtsOptions[0].layer).toBe('test-3857-2');
    expect(wmtsOptions[0].matrixSet).toBe('GLOBAL_WEBMERCATOR');
    expect(wmtsOptions[0].crossOrigin).toBe('anonymous');
    expect(wmtsOptions[0].projection.getCode()).toBe('EPSG:3857');

    layer = layers[2];
    descriptor = new OGCDescriptor();
    parser.parseLayer(capabilities, layer, descriptor);

    expect(descriptor.getTitle()).toBe('WMTS 4326 Layer 1');
    expect(descriptor.getDescription()).toBe('Description of WMTS 4326 Layer 1.');
    expect(descriptor.getWmtsDateFormat()).toBe('YYYY-MM-DD');
    expect(descriptor.getWmtsTimeFormat()).toBe('{start}');
    expect(arrayEquals(descriptor.getBBox(), expectedBbox4326)).toBe(true);

    wmtsOptions = descriptor.getWmtsOptions();
    expect(wmtsOptions.length).toBe(1);
    expect(wmtsOptions[0].layer).toBe('test-4326-1');
    expect(wmtsOptions[0].matrixSet).toBe('GLOBAL_PLATECARREE');
    expect(wmtsOptions[0].crossOrigin).toBe('anonymous');
    expect(wmtsOptions[0].projection.getCode()).toBe('EPSG:4326');
  });
});
