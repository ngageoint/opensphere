Parsing
=======

Let's have a look at the JSON response from Tileserver.

.. code-block:: json
  :caption: ``/index.json``

  [
    {
      "tilejson": "2.0.0",
      "name": "Basic preview",
      "attribution": "<a href=\"http://openmaptiles.org/\" target=\"_blank\">&copy; OpenMapTiles</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap contributors</a>",
      "minzoom": 0,
      "maxzoom": 20,
      "bounds": [8.275, 47.225, 8.8, 47.533],
      "format": "png",
      "type": "baselayer",
      "tiles": ["http://localhost:8081/styles/basic-preview/{z}/{x}/{y}.png"],
      "center": [8.537500000000001, 47.379000000000005, 11]
    },
    {
      "tiles": ["http://localhost:8081/data/v3/{z}/{x}/{y}.pbf"],
      "name": "OpenMapTiles",
      "format": "pbf",
      "basename": "zurich_switzerland.mbtiles",
      "id": "openmaptiles",
      "attribution": "<a href=\"http://openmaptiles.org/\" target=\"_blank\">&copy; OpenMapTiles</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap contributors</a>",
      "description": "https://openmaptiles.org",
      "minzoom": 0,
      "maxzoom": 14,
      "center": [8.5375, 47.379, 10],
      "bounds": [8.275, 47.225, 8.8, 47.533],
      "version": "3.3",
      "type": "overlay",
      "tilejson": "2.0.0"
    }
  ]

The first layer is an XYZ (see ``tiles`` template) PNG (``format = 'png'``) layer that is intended as base map imagery (``type = 'baselayer'``). OpenSphere already supports `XYZ layers`_ and `base map layers`_, so we can take advantage of a lot of code that already exists.

.. _XYZ layers: https://github.com/ngageoint/opensphere/tree/master/src/plugin/xyz
.. _base map layers: https://github.com/ngageoint/opensphere/tree/master/src/plugin/basemap

The second layer is a vector format, which we will ignore in this guide. The first JSON object is very similar to the layer config JSON needed to create XYZ layers. So all we have to do is translate it.

.. literalinclude:: src/plugin/tileserver/tileserver-parsing.js
  :caption: ``src/plugin/tileserver/tileserver.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3-6, 8-12, 14, 40-41, 63-72, 75-133

Let's test it.

.. literalinclude:: test/plugin/tileserver/tileserver-parsing.test.js
  :caption: ``test/plugin/tileserver/tileserver.test.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 2, 4, 10, 12, 108-194

``yarn test`` should result in a clean test run. Now let's ensure that our descriptor type is registered in our plugin.

.. literalinclude:: src/plugin/tileserver/tileserverplugin-parsing.js
  :caption: ``src/plugin/tileserver/tileserverplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3, 37

Since ``ConfigDescriptor`` is highly resuable, it is possible that several plugins make that same registration. That's fine.

Now run the build and open up the debug instance again. This time the server should complete its loading and show a child node for the parsed layer. Toggling the child should enable the given layer, and the layer should persist on refresh.

We've got the provider working if added by an admin in config, but what about the user? Let's handle that next.
