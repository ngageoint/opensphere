Data Descriptor
---------------

Now that we have a data provider, we need to create the item that becomes the leaf node in that tree.

.. literalinclude:: src/plugin/georss/georssdescriptor.js
  :caption: ``src/plugin/georss/georssdescriptor.js``
  :linenos:
  :language: javascript

Let's walk through that real quick. ``getType`` reports ``FEATURES`` because we are loading vector data. ``getLayerOptions`` returns the JSON object that will be fed to the layer config class that we created earlier. The last two static methods assist with creating and updating a descriptor from the model produced by the import UI.

As always, here's the test.

.. literalinclude:: test/plugin/georss/georssdescriptor.test.js
  :caption: ``test/plugin/georss/georssdescriptor.test.js``
  :linenos:
  :language:  javascript

Now let's register it in our plugin.

.. literalinclude:: src/plugin/georss/georssplugin.js-descriptor
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 6, 58-59

We now have everything we need to get an entry into the Add Data window. So let's do that! Our UI launcher currently does not launch a UI (and it still won't), but it could just save a new descriptor directly without any user input at all. Here's how you hook that up:

.. literalinclude:: src/plugin/georss/georssimportui.js-descriptor
  :caption: ``src/plugin/georss/georssimportui.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3-4, 47-58

This adds the descriptor to the descriptor list, adds it as a child of the provider, and then pretends that the user went ahead and found it in Add Data and turned it on. To try this out:

#. Go to Open File/URL
#. Paste https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.atom or another URL in the field there
#. Hit "Next"

Boom! The layer is on the map. But we kinda had that before. Now it will persist through a restart. So refresh the page and bask in your accomplishment! You can also check it out in the Add Data window, as now there will be a GeoRSS Files > 2.5_day.atom entry. Try importing the same URL again. OpenSphere will detect that you already have a descriptor with the same URL and ask you what you would like to do before continuing.
