.. _file-layer-config:

Layer Config
------------

Now that we have a parser, we can hook that up to a layer. OpenSphere automatically configures layers through registered classes dubbed "layer configs". Given a JSON object like:

.. code-block:: json

  {
    "type": "georss"
  }

OpenSphere looks up the registered layer config class for the type ``georss``, instantiates it, and passes it that JSON object to create the layer.

Let's create that class.

.. literalinclude:: src/plugin/georss/georsslayerconfig.js
  :caption: ``src/plugin/georss/georsslayerconfig.js``
  :linenos:
  :language: javascript

The parent class, ``os.layer.config.AbstractDataSourceLayerConfig`` handles most of the heavy lifting and common key/value pairs like ``title``, ``url``, ``description``, etc. All we have to do is pass it a parser.

And, since we are good developers, here is a test for it.

.. literalinclude:: test/plugin/georss/georsslayerconfig.test.js
  :caption: ``test/plugin/georss/georsslayerconfig.test.js``
  :linenos:
  :language: javascript

Now that we have that tested, we need to modify our plugin and register the layer config:

.. literalinclude:: src/plugin/georss/georssplugin.js-layer_config
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 5,32-33

Running ``yarn build`` and viewing the debug instance of the application should allow you to drop this in the console and have a GeoRSS layer:

.. code-block:: javascript

  os.commandStack.addCommand(
    new os.command.LayerAdd({
      type: plugin.georss.ID,
      id: goog.string.getRandomString(),
      title: 'Test GeoRSS Layer',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.atom',
      color: 'FFFF00'
    })
  );

Cool! But unfortunately this layer is not saved across sessions and it does not support the OpenSphere file/URL import flow. We will do that next!
