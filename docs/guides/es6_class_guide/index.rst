Using ES6 Classes in OpenSphere
===============================

As part of the transition, OpenSphere is converting all Google Closure style classes to use the `ES6 class syntax`_. An ES6 ``class`` is fundamentally the same as a class in Closure, which means the two can be intermingled to a degree.

.. _ES6 class syntax: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

External Documentation
**********************

The following are a few helpful guides/references for ES6 classes. It's recommended to start here if you do not already have an understanding of JavaScript classes.

- `Introduction to ES6 classes <https://medium.com/beginners-guide-to-mobile-web-development/javascript-introduction-to-es6-classes-ecb2db9fe985>`_
- `MDN reference <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes>`_
- `Simple ES6 guide <https://flaviocopes.com/es6/#classes>`_

ES6 vs Closure
**************

While ES6 classes and Closure classes are nearly the same under the hood, they are very different in syntax. This section outlines the key differences.

Closure Constructor
-------------------

- Class name assigned to a constructor function.
- Requires the ``@constructor`` JSDoc annotation to inform the compiler that it's a class constructor.
- If it extends another class, the ``@extends`` annotation is also required.
- Parent constructor is invoked with ``<class>.base(this, 'constructor', <args>)``.
- Class properties are added with ``this.<property>``.
- Prototypal inheritance is established by calling ``goog.inherits(<child>, <parent>)``.

.. literalinclude:: src/closureclass.js
  :lines: 5-22
  :language: javascript

ES6 Constructor
---------------

- Defined using the ``class`` keyword.
- Constructor is defined with the special ``constructor`` function. The ``@constructor`` annotation is not required.
- If it extends another class, the ``extends`` keyword is used. This establishes prototypal inheritance, and cues the compiler so ``@extends`` is not required. ``@extends`` is still used when providing generic types for a template (ie, ``@extends {MyParentClass<MyType>}``).
- Parent constructor is invoked with ``super(<args>)``.
- Class properties are added with ``this.<property>``.

.. literalinclude:: src/es6class.js
  :lines: 6-32
  :language: javascript

.. warning:: An ES6 class can extend a Closure class, but not the reverse. Closure classes add properties under the hood for ``goog.base`` and ES6 classes will not have these. This means leaf classes must be refactored before their parents.

Member Functions
----------------

With Closure classes, member functions are added to the prototype. They reference the parent function using ``<class>.base(this, '<function>', <args>)``.

.. literalinclude:: src/closureclass.js
  :lines: 24-30
  :language: javascript

In ES6, member functions are defined within the ``class``. They reference the parent function using ``super.<function>(<args>)``.

.. literalinclude:: src/es6class.js
  :lines: 25-31
  :language: javascript

.. note:: OpenSphere has historically used the ``<get/set>PropName`` pattern to get/set properties on a class. The `get`_ and `set`_ syntax has been around for awhile and works well with ES6 classes, but switching to it would be a breaking change.

.. _get: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
.. _set: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set

Properties
----------

Both class styles define their properties in the constructor in much the same manner.

The key difference for ES6 classes is that they are `@struct`_ by default, which prevents using bracket notation or adding properties outside the constructor. If either of those are needed (ie, using bracket notation to avoid property renaming), the class must have `@unrestricted`_ in the JSDoc.

.. _@struct: https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler#struct
.. _@unrestricted: https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler#unrestricted

.. code-block:: javascript

    /**
     * @unrestricted
     */
    class MyClass {
      constructor() {
        // bracket notation to avoid compilation
        this['id'] = 1234;
      }
    }

Singletons
----------

Class instance singletons have historically been created using ``goog.addSingletonGetter`` which adds a ``getInstance`` function to the class. With ES6 classes and the local scope provided by modules, this is easy to do natively by adding a ``static getInstance()`` call to the class.

.. code-block:: javascript

    // store the instance in a module-scoped variable that can be externally referenced
    // with MyClass.getInstance()
    let instance;

    class MyClass {
      constructor() {}

      static getInstance() {
        // do not create the instance until the first time this function is called
        if (!instance) {
          instance = new MyClass();
        }

        return instance;
      }
    }

Constants
---------

Constants on a class can be represented using a combination of the `static`_ and `get`_ keywords. This is a convenient way to define the constant on the class without needing to export the constant.

.. _static: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static
.. _get: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get

.. code-block:: javascript

    class MyClass {
      constructor() {}

      static get MY_CONSTANT() {
        return theConstant;
      }
    }

    // constant can be externally referenced with MyClass.MY_CONSTANT
    const theConstant = 42;
