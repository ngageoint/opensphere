Import UI
---------

For external plugins, you will need to create at least one define for your project. This will allow Angular to find your templates properly.

.. literalinclude:: src/plugin/georss/defines.js
  :caption: ``src/plugin/georss/defines.js``
  :linenos:
  :language: javascript

Now we will create an Angular directive that will let the user change the title and color of the the layer.

.. literalinclude:: src/plugin/georss/georssimport.js
  :caption: ``src/plugin/georss/georssimport.js``
  :linenos:
  :language: javascript


