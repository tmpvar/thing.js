controller.on('button:pressed', function(event) {
  var x = player.get('x');
  player.set('x', x.add(1));
});

player.get = function(key) {
  var ret = new Promise({
    add = function(value) {
      var ret = new Promise();
      var resolve = function(resolvedValue) {
        this.then(function(myValue) {
          var newValue = myValue + resolvedValue;
          ret.resolve(newValue);
        });
      };

      if (isPromise(value)) {
        value.then(resolve);
      } else {
        resolve(value)
      }

      return ret;
    }

  });

  var resolveKey = function(resolvedKey) {
    player.data.get('key', function(err, data) {
      ret.resolve(data);
    });
  };

  if (isPromise(key)) {
    key.then(resolveKey);
  } else {
    resolveKey(key);
  }

  return ret;
};

player.set = function(key, promise) {
  var ret = new Promise();

  var resolveKey = function(resolvedKey) {
    var save = function(resolvedValue) {
      var filterchain = createChain([], function(data, fn) {
        player.datastore.save(data.key, data.value, fn);
      });

      filterchain({ key : key, value: resolvedValue }, function(errors, data) {
        if (errors) {
          return ret.errors(errors);
        }

        ret.resolve(data);
      });
    };

    if (isPromise(promise)) {
      promise.then(save);
    } else {
      save(promise);
    }
  };

  if (isPromise(key)) {
    key.then(resolveKey);
  } else if (key) {
    resolveKey(key);
  } else {
    throw new Error('that key does not exist');
  }

  return ret;
}




