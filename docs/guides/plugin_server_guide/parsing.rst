Parsing
=======

Let's have a look at the JSON response from Tileserver.

.. code-block:: json
  :caption: ``/index.json``

  [{
    "tilejson": "2.0.0",
    "name": "Klokantech Basic",
    "attribution": "<a href=\"http://openmaptiles.org/\" target=\"_blank\">&copy; OpenMapTiles</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap contributors</a>",
    "minzoom": 0,
    "maxzoom": 20,
    "bounds": [8.275,47.225,8.8,47.533],
    "format":"png",
    "type":"baselayer",
    "tiles": ["http://localhost:8081/styles/klokantech-basic/{z}/{x}/{y}.png"],
    "center": [8.537500000000001,47.379000000000005,11]
  }, {
    "tilejson":"2.0.0","name":"OSM Bright","attribution":"<a href=\"http://openmaptiles.org/\" target=\"_blank\">&copy; OpenMapTiles</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap contributors</a>","minzoom":0,"maxzoom":20,"bounds":[8.275,47.225,8.8,47.533],"format":"png","type":"baselayer","tiles":["http://localhost:8081/styles/osm-bright/{z}/{x}/{y}.png"],"center":[8.537500000000001,47.379000000000005,11]
  }, {
  "format":"pbf"
  }]

The first two layers are XYZ (see ``tiles`` template) PNG (``format = 'png'``) layers that are intended as base map imagery (``type = 'baselayer'``). OpenSphere already supports `XYZ layers`_ and `base map layers`_, so we can take advantage of a lot of code that already exists.
    
.. _XYZ layers: https://github.com/ngageoint/opensphere/tree/master/src/plugin/xyz
.. _base map layers: https://github.com/ngageoint/opensphere/tree/master/src/plugin/basemap

The last layer is a vector format, which we will ignore in this guide. The first two JSON objects are very similar to the layer config JSON needed to create XYZ layers. So all we have to do is translate them.

.. literalinclude:: src/plugin/tileserver/tileserver.js
  :caption: ``src/plugin/tileserver/tileserver.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3, 5, 7, 10-13, 36-37, 58-67, 71-126

Let's test it.

.. literalinclude:: test/plugin/tileserver/tileserver.test.js
  :caption: ``test/plugin/tileserver/tileserver.test.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 2, 97-183

``yarn test`` should result in a clean test run. Now run the build and open up the debug instance again. This time the server should complete its loading and a couple of child nodes. Toggling those nodes should enable the given layers. That's pretty much it for providers. If you want to connect to a provider using formats not already supported by OpenSphere, then follow the :ref:`file-parser` and :ref:`file-layer-config` sections of the :ref:`file-type-guide`.
