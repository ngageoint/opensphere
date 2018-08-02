.. _file-parser:

Parser
------

The first thing we need is a parser that can take the file and turn it into usable ``ol.Feature`` instances.

.. literalinclude:: src/plugin/georss/georssparser.js
  :caption: ``src/plugin/georss/georssparser.js``
  :linenos:
  :language: javascript

Whew. That was a lot for one step. It is not exhaustive, and a full implementation would want to support RSS in addition to Atom as well as the ``<georss:elev>`` tag. However, it still would not be complete without some tests.

.. literalinclude:: test/plugin/georss/georssparser.test.js
  :caption: ``test/plugin/georss/georssparser.test.js``
  :linenos:
  :language: javascript

There. Now we can fully test our parser with ``yarn test``.
