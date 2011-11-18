Entity.register('reflex.collection', {

  append : function(key, value, options, fn) {
    var
    event = Entity.createEvent(key, value, options, fn),
    slotEvent;


    for (var key in event.values) {
      slotEvent = Entity.copy(event);

      delete slotEvent.done;

      slotEvent.values = {};
      slotEvent.values[key] = event.values[key];
      this.set(slotEvent);
    }

    event.done(null);
    return this;
  }
});

Entity.register('reflex.validator', {
  validate : function(event) {}
});

Entity.register('reflex.validation', {
  features : {
    'reflex.collection'
  },
  validate : function(event, fn) {
    var
    validators = this.get('items'),
    i = 0, done = 0, l = validators.length,
    errors = {},
    validator,
    resultHandler = function(key, err) {
      if (err) {
        errors[key] = err;
      }
      done++;
      if (done > l) {
        fn(errors)
      }
    }

    // Send off all of the validation steps at once
    for (var key in validators) {
      validators[key.validate(event, (function(validatorName) {
        return function(err) {
          resultHandler(validatorName, err);
        }
      })(key);
    }

  }
});

Entity.register('reflex.min', {
  features : ['reflex.validator'],
  validate : function(event, fn) {
    var value = parseFloat(event.values[0]), error = null;
    if (value < this.get('min')) {
      error = new Error(this.get('error'));
    }
    fn(error);
  }
});

Entity.register('reflex.max', {
  features : ['reflex.validator']
  validate : function(event, fn) {
    var value = parseFloat(event.values[0]), error = null;
    if (value > this.get('max')) {
      error = new Error(this.get('error');
    }
    fn(error);
  }
});

Entity.register('reflex.field', function() {
  features : ['reflex.validation'],
  validators : [],
  get : function() {

  },
  set : function(key, value, options, fn) {
    var event = Entity.createEvent(key, value, options, fn);

    // TODO: if there are multiple values being set, each one needs to be
    //       validated

    // PROBLEM: if part of the batch fails, does the whole thing get rejected
    //          or does it do a partial update?
    this.validate(event, function(errors) {
      if (errors) {
        return event.done(errors);
      }

      Entity.set(event);
    });
  }
});

Entity.register('reflex.field.weight', {
  features: [
    'reflex.field',
    'reflex.validation'
  ],
  validators : [{
    validators : [{
      name     : 'min'
      features : ['reflex.min'],
      value    : 0
      error    : 'You cannot have negative weight!'
    }, {
      name     : 'max',
      features : ['reflex.max'],
      value    : 100 // we can't ship things that weight more than 100 units!
      error    : function(value) {
        return value + ' units is certainly too heavy to ship!'
      }
    }]
  }],
  init : function() {
  }
});

// later on we create the entity type
Entity.register('reflex.product', {
  features : [
    {
      name : 'reflex.collection', // collection of fields
      items : {
        weight : 'reflex.field.weight'
      }
    }
  ],
  init : function() {
  }
});

// now we can create instances of reflex products
var product = Entity.create('reflex.product');
product.set('weight', 201); // throws an error "201 units is certainly too heavy to ship!"

// later on, we realize that 200 doesn't work for every case and we need an exception
Entity.register('reflex.heavier.product', {
  features : [
    name : 'reflex.product',
    items : {
      'weight.validation.max': {
        value : 300, // override the max,
        error : function(value) {
          return 'Are you serious?'
      }
    }
  ]
});

var heavy = Entity.create('reflex.heavier.product');
heavy.set('weight', 201); // AOK
heavy.set('weight', 301); // throws an error "Are you serious?"

// Validation Link
Entity.trait('validation', function(obj, options) {
  var
  stepConfig,
  step,
  filterStep = function (event, next, cancel) {
    // hook up the validators as sub-steps in the chain
    var filterChain = Entity.createFilterChain(this.steps);

    // execute the chain
    filterChain.execute(event, function(error) {
      if (error) {
        cancel(error);
      } else {
        next(data);
      }
    });
  };

  // Collect the attributes and add a group
  for (var attributeName in options.attributes) {
    if (options.attributes.hasOwnProperty(attribute)) {
      stepConfig = options.attributes[attribute] || {};

      // Create and add a validation step to the attribute
      step = Entity.createFilterStep(stepConfig, filterStep);

      Entity.registerStep('set', attributeName, step);
    }
  }

  // this trait does not add anything to the object except for steps to the appropriate
  // attribute 'set' methods
  return null;
});

// Simple integer check
function ensure_integer(event, next, cancel) {
  var value = parseInt(event.val, 10)
  if (isNaN(value)) {
    done(new Error('invalid'));
  } else {
    next();
  }
}

// Simple less than validator
function greater_than(event, next, cancel) {
  if (event.val > this.get('value')) {
    next(function(done) {
      // do some post processing
      // - this function is optional
      done();
    });
  } else {
    // cancel the request to set this attribute
    cancel(new Error('invalid'))
  }
}

// Usage
var e = new Entity({
  traits : [{
    name : 'validation',
    attributes : {
      age :  ['ensure_integer', {
        name : 'greater_than',
        value : 18
      }]
    }
  }]
});


