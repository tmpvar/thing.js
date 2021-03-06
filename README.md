# Thing

```javascript

var Thing = require('thing');

// register a trait
Thing.trait('uid', function(proto) {
  var uid = 0;

  // add a function to be run when the object is created
  proto.init(function(options) {
    uid += 1;
    this.meta('uid', uid, { freeze : true });
  });
});

// create a class of things containing
// the `uid` trait
var Obj = Thing.class(['uid']);

console.log((new Obj()).meta('uid')) // 1
console.log((new Obj()).meta('uid')) // 2
console.log((new Obj()).meta('uid')) // 3

// attempt to set the key of frozen metadata
var obj = new Obj();
console.log(obj.meta('uid')) // 4

obj.meta('uid', 0);

// it doesn't change
console.log(obj.meta('uid')) // 4

```

## Description

`Thing` is a object creation paradigm that centers on metadata and traits. In fact,
there is no easy way to directly manipulate prototypes without using traits.

This is by design.

Actions should be separated into compatible groups, and their reuse should not be
limited to a single prototype or class.  You may also notice, that Thing lacks the
typical things like events, getters/setters, models, views, and friends. These are
intended to be provided by third party traits, rather than being baked into the
core.

The "extras" mentioned above can easily be implemented in traits. The goal of
this library is to remain small and flexible.

### Construction

Things are created by

```javascript
var obj = Thing.create(['some', 'traits']);
```

or by creating a class and instantiating that

```javascript
var Class = Thing.class(['some', 'traits']);
var obj = new Class()
```

Classes have trait management functions that will affect traits created in the future

```javascript
var Class = Thing.class(['some', 'traits']);

console.log(Class.has('some')) // true

Class.remove('some');

console.log(Class.has('some')) // false

Class.add('another trait');

console.log(Class.has('another trait')) // true
```

### Metadata

All instantiated things have a `meta` method which acts as a getter and setter.

```javascript
console.log(instance.meta('a', 1)) // 1
console.log(instance.meta('a')) // 1
```

Metadata may be "frozen"

```javascript
console.log(instance.meta('a', 1 { freeze : true })); // 1
console.log(instance.meta('a', 2)) // 1
```

__note__: objects contained in metadata are not frozen, so something like
```i.meta('obj').a = 2``` will not be stopped

### Traits

#### Creating traits
The creation of traits is as follows

```javascript
Thing.trait('trait name', function(proto) {
  proto.prototypeProperty = 1; // append a property to the incoming prototype
})
```

or

```javascript
Thing.trait('trait name', {
  prototypeProperty : 1
});
```

#### Using traits

Traits must be compiled into a class before they are able to be used

```javascript

var Constructor = Thing.class(['list','of', 'registered', 'trait names'])

new Constructor() // will contain the traits: list, of, registered, and 'trait names'
```

## Usage

### On node.js

  `npm install thing`


### On the browser

  ```html
  <script type="text/javascript" src="https://raw.github.com/tmpvar/thing.js/master/lib/thing.min.js"></script>
  <script type="text/javascript">
    console.log(typeof Thing) // "function"
  <script>
  ```
