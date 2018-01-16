Import UI Launcher
------------------

Import UI Launchers are small classes that configure and launch a UI to let the user set options on the layer. Minimally this should let the user set the layer title and adjust the color.

.. literalinclude:: src/plugin/georss/georssimportui.js
  :caption: ``src/plugin/georss/georssimportui.js``: 
  :linenos:
  :language: javascript

Now we will register our launcher in the plugin.

.. code-block:: javascript
  :caption: ``src/plugin/georss/georssplugin.js``:
  :linenos:

  // import our new class at the top 
  goog.require('plugin.georss.GeoRSSImportUI');

  // ...
  // now add to init() ...

  // register the georss import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('GeoRSS', true);
  im.registerImportUI(plugin.georss.ID, new plugin.georss.GeoRSSImportUI());

Run the build. This gets rid of the error, but our launcher does not launch anything! Let's fix that.
