Import UI
---------

For external plugins, you will need to create at least one define for your project. This will allow Angular to find your templates properly.

.. literalinclude:: src/plugin/georss/defines.js
  :caption: ``src/plugin/georss/defines.js``
  :linenos:
  :language: javascript

Note that the path should be the relative path from ``opensphere`` to your project.

Now we will create an Angular directive that will let the user change the title and color of the the layer.

.. literalinclude:: src/plugin/georss/georssimport.js
  :caption: ``src/plugin/georss/georssimport.js``
  :linenos:
  :language: javascript

The parent class, once again, does most of the heavy lifting. We do, however, need to provide the template that we referenced for Angular.

.. literalinclude:: views/plugin/georss/georssimport.html
  :caption: ``views/plugin/georss/georssimport.html``
  :linenos:
  :language: html

Cool. Now let's undo our launcher changes from the last step and make it look like this:

.. literalinclude:: src/plugin/georss/georssimportui.js
  :caption: ``src/plugin/georss/georssimportui.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 5-6, 47-64

To test that Import UI, we need a few tests:

.. literalinclude:: test/plugin/georss/georssimportui.test.js
  :caption: ``test/plugin/georss/georssimportui.test.js``
  :linenos:
  :lines: 1-33
  :language: javascript


Save, build, test, and pull it up.

#. Go to Add Data > GeoRSS Files and delete any entries under there by highlighting and clicking the trash can
#. Import https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.atom or your URL again

This time it should launch the UI that we just made. Change the title, description, tags, and or color and hit "OK" to save it.

Most of our import UIs are not quite this simple. Even GeoJSON requires the user to set up time mappings. Our format has the ``updated`` field which contains a time, so let's get that supported in order for the layer to animate properly.
