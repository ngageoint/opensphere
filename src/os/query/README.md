# Abandon Hope All Ye Who Enter Here!

Kidding. Mostly. If you are looking through this package you are probably
muttering obscenities in my direction. This should help explain,
or perhaps just rationalize, the 

## What you have stumbled upon

The "combinator" (which is technically the UI that interacts with the
QueryManager but is generally used to refer to the package as a whole) combines
triples of Layers, Areas, and Filters for use in queries. This allows power
users the option of choosing which filters to combine with which areas.

    (Layer1, Area1, Filter1)
    (Layer2, Area1, Filter2)
    ...

That in itself is not a difficult problem, however, it requires the user to be
painstakingly explicit as every area or filter is added to the application.
Therefore, we have the notion of "wildcards", wherein an item can be combined
with multiple other items when "expanded".

    (Layer1, Area1, *)
    (Layer1,     *, Filter1)

Initially, this will combine to just `(Layer1, Area1, Filter1)`, but as more
areas and filters are added, we will end up with something like

    (Layer1, Area1, *)
    (Layer1, Area2, *)
    (Layer1,     *, Filter1)
    (Layer1,     *, Filter2)

This expands to:

    (Layer1, Area1, Filter1)
    (Layer1, Area1, Filter2)
    (Layer1, Area2, Filter1)
    (Layer1, Area2, Filter2)

As you can see, this does not necessarily save us any space when storing the
triples, but it does allow us to store the user's intention for how the item
should interact with other new items in the future. This model allows the 80-90%
case to use a simpler UI:

* Layer1  // (layer=Layer1)
  * [x] Areas // (filter=\*)
    * [x] Area1 // (area=Area1)
    * [ ] Area2 // (area=Area2)
  * [x] Filters // (area=\*)
    * [x] Filter1 // (filter=Filter1)
    * [x] Filter2 // (filter=Filter2)

This UI stores the triple from the root to the leaf:
  
    (Layer1, Area1, *)
    (Layer1,     *, Filter1)
    (Layer1,     *, Filter2)

If the user chooses "Advanced", then we show them a tree representing the full
expanded set of triples:

* Layer1
  * [x] Area1
    * [x] Filter1
    * [x] Filter2
    * [ ] No Filter
  * [ ] Area2
    * [ ] Filter1
    * [ ] Filter2
    * [ ] No Filter

This UI stores the triples more explicitly:

    (Layer1, Area1, Filter1)
    (Layer1, Area1, Filter2)

Note that even though Layer > Area > Filter often makes the most sense to users,
the tree is simply representing triples so it could easily be reordered any which
way.

## Feeling confident? Good, let's make that go away

While filters are typically closely tied to specific layers due to the column
names used in the filter, areas do not have a limitation. Any layer supporting
spatial queries should support areas. Thus, we have the lovely notion of
"double wildcard areas": 

    (*, Area1, *)

This says, "apply Area1 to every layer for every filter". This is exactly what
happens when you draw an area and hit "Load" or "Add". The lesser-used
"Choose Layers" would allow you to pick a layer or set of layers which could
result in:

    (Layer1, Area1, *)
    (Layer2, Area1, *)

But since basically no one does that, nearly all areas end up as double
wildcards. This has some implications for our UIs.

The simpler view:

* Layer1
  * Areas
    * [ ] Area1
  * Filters
    * [x] Filter1
    * [x] Filter2

The advanced view:

* Layer1
  * [ ] Area1
    * [ ] Filter1
    * [ ] Filter2
    * [ ] No Filter

Here the user has unchecked the area, meaning that it should not be used for
this layer. We cannot remove the previous double-wildcard area triple, as it
could still be used in other layers. Instead, this action adds a _negation_,
which is indicated by the presence of a `negate` field on the triple object:

    (*, Area1, *)
    (Layer1, Area1, null), negate=true

The second triple cancels out the first, but only on Layer1.


## That all makes sense, so WTF have I been looking at?

Now we will map all that to code.

The beefy portions of all of this are in `os.query.BaseQueryManager`'s `getExpanded`
and `getPivotData` functions.

### getExpanded

Every time an entry or set of entries is added, `getExpanded()` is called to
generate the expanded list of items without wildcards that can be passed to the
query handlers. This can also be called with a custom set of entries in order
for the Combinator UI to do diffs to determine if anything changed.

### getPivotData

This generates the tree structure shown in the Combinator UI given a set of
"pivots" (which is the tree ordering aka `['layer', 'area', 'filter']`).


### Query Handler

Lastly, `os.ui.query.QueryHandler.prototype.createFilter()` processes the entries
and writes out the actual filter to be sent to the server.


## Retrospection

I _think_ that the Desktop version of OpenSphere may have opted for the simpler
"just store explicit triples" as covered in the start of this document. I am not
intimately familiar with the UI differences due to that decision. If this is
ever rewritten then it would be helpful to track down the implementation and the
UI differences in both applications before attempting a new version. This version
has certainly been difficult to understand, even if it works and is well-tested.


## Minor details generally unharmful to brains when discussed

### Everything the light touches

Area exclusions (e.g. "query this box (inclusion) but not this particular area
(exclusion))" are accomplished with a `includeArea` field on the triple object:

    (*, Area1, *), areaInclude=true|false

### And or Or, Or and And

How multiple filters are grouped when written out is written out to the
`filterGroupd` field in each entry (which is strange since it is really more of
an aggregate). e.g.

    (*, Area1, *), areaInclude=true
    (Layer1, Area1, Filter1), filterGroup=false
    (Layer1, Area1, Filter2), filterGroup=false

Would result in an `Or` grouping:

    <And>
      <Intersects id="Area1">...</Intersects>
      <Or>
        Filter1
        Filter2
      </Or>
    </And>

Where `true` would result in an `And` grouping.


### Sharing with others 

These triples end up in the `<queryEntries>` tag in state files. That list is
the explicit, expanded list of triples and should never contain wildcards.
