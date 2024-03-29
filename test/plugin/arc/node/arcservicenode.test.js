goog.require('os.ui.data.DescriptorNode');
goog.require('plugin.arc.ArcServer');
goog.require('plugin.arc.layer.ArcLayerDescriptor');
goog.require('plugin.arc.node.ArcServiceNode');


describe('plugin.arc.node.ArcServiceNode', function() {
  const {default: DescriptorNode} = goog.module.get('os.ui.data.DescriptorNode');
  const {default: ArcServer} = goog.module.get('plugin.arc.ArcServer');
  const {default: ArcLayerDescriptor} = goog.module.get('plugin.arc.layer.ArcLayerDescriptor');
  const {default: ArcServiceNode} = goog.module.get('plugin.arc.node.ArcServiceNode');

  it('should add layer descriptors as children to itself', function() {
    var server = new ArcServer();
    var config = {
      'label': 'Arc Test',
      'type': 'arc',
      'url': 'https://fake.server.com/arcgis/rest/services'
    };
    server.configure(config);

    var layerConfig = {
      'name': 'My Little Arc Layer',
      'description': 'The Power of Arc Layers',
      'id': 'someLayerId',
      'extent': {
        'spatialReference': {
          'latestWkid': 4326,
          'wkid': 4326
        },
        'xmin': 40,
        'ymin': 20,
        'xmax': 60,
        'ymax': 56
      },
      'timeInfo': {
        'startTimeField': 'start_field',
        'endTimeField': 'end_field',
        'timeExtent': [99999, 1010101010]
      },
      'drawingInfo': {},
      'fields': [
        {
          'name': 'GEOMETRY',
          'type': 'esriFieldTypeGeometry'
        },
        {
          'name': 'NAME',
          'type': 'esriFieldTypeString'
        },
        {
          'name': 'FREQUENCY',
          'type': 'esriFieldTypeNumber'
        }
      ],
      'capabilities': 'Map,Query'
    };

    var node = new ArcServiceNode(server);
    node.setUrl(server.getUrl());
    node.addLayer_(layerConfig);

    expect(node.getChildren().length).toBe(1);
    var dNode = node.getChildren()[0];
    expect(dNode instanceof DescriptorNode).toBe(true);

    var d = dNode.getDescriptor();
    expect(d instanceof ArcLayerDescriptor).toBe(true);
    expect(d.getTitle()).toBe('My Little Arc Layer');
  });
});
