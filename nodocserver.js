(function() {
  var BSON, Connection, Db, GridStore, ObjectID, Server, app, coffee, db, express, format, fs, host, http, io, jade, parser, port, url, zipfile, _;

  express = require("express");

  http = require("http");

  url = require("url");

  io = require("socket.io");

  fs = require("fs");

  coffee = require("coffee-script");

  _ = require("underscore");

  jade = require('jade');

  Db = require("mongodb").Db;

  GridStore = require("mongodb").GridStore;

  ObjectID = require("mongodb").ObjectID;

  Connection = require("mongodb").Connection;

  Server = require("mongodb").Server;

  BSON = require("mongodb").BSONPure;

  format = require("util").format;

  zipfile = require("zipfile");

  parser = require("libxml-to-js");

  app = express.createServer();

  host = (process.env["MONGO_NODE_DRIVER_HOST"] != null ? process.env["MONGO_NODE_DRIVER_HOST"] : "localhost");

  port = (process.env["MONGO_NODE_DRIVER_PORT"] != null ? process.env["MONGO_NODE_DRIVER_PORT"] : Connection.DEFAULT_PORT);

  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    return app.use(express.static(__dirname + "/public"));
  });

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  db = new Db("nodoc", new Server(host, port, {}), {
    native_parser: true
  });

  /*
  collections:
    deployments
      name
      environments
      servers
      deploymentId
    environments
  */

  db.open(function(err, db) {
    var getGridFSFile, writeGridFSFile;
    app.get("/", function(req, res) {
      var relativePath;
      relativePath = "/";
      return res.render("default", {
        id: req.params[1],
        theme: "new",
        relativePath: relativePath,
        layout: 'layout'
      });
    });
    /*
    
        Loves specific functionality
    */
    /*
    
        D3 specific functionality
    */
    app.get(/^\/?([A-Za-z0-9\-]*)\.js$/, function(req, res) {
      var content, csFile;
      csFile = "" + __dirname + "/views/coffee/" + req.params[0] + ".coffee";
      content = coffee.compile(fs.readFileSync(csFile, 'utf8'));
      return res.send(content, 200);
    });
    app.get(/^\/*([^\.^\/]*)(?:\/(.*))?$/, function(req, res, next) {
      var i, relativePath;
      if (req.params[0] === "" || req.params[0] === "stylesheets" || req.params[0] === "javascripts" || req.params[0] === "api" || req.params[0] === "images") {
        return next();
      } else {
        relativePath = ((function() {
          var _i, _len, _ref, _results;
          _ref = req.params;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            i = _ref[_i];
            _results.push("../");
          }
          return _results;
        })()).join('');
        return res.render("" + req.params[0], {
          id: req.params[1],
          theme: "new",
          relativePath: relativePath,
          layout: 'layout'
        });
      }
    });
    /*
    
      Generic Demo functionality
    */
    getGridFSFile = function(callback, id) {
      var gs;
      gs = new GridStore(db, new ObjectID(id), 'r');
      return gs.open(function(err, gs) {
        return gs.read(callback);
      });
    };
    writeGridFSFile = function(file, callback) {
      var gs, objID;
      objID = new ObjectID();
      gs = new GridStore(db, objID, "w");
      return gs.open(function(err, gridStore) {
        var readStream;
        if (err) {
          return callback(err, gridStore);
        } else {
          readStream = fs.createReadStream(file.path);
          readStream.on('data', function(data) {
            return gs.write(data, {
              "content_type": file.type
            }, function(err) {});
          });
          return readStream.on('end', function() {
            return gs.close(function(err, result) {
              if (err) {
                console.log(err);
                return callback(err, result);
              } else {
                db.collection("fs.files", function(err, collection) {
                  return collection.update({
                    _id: result._id
                  }, {
                    $set: {
                      contentType: file.type,
                      orig_filename: file.name
                    }
                  });
                });
                result.contentType = file.type;
                result.filename = file.name;
                return callback(err, result);
              }
            });
          });
        }
      });
    };
    app.get("/gridstore", function(req, res) {
      var fn;
      fn = jade.compile("!!!\nhtml\n  head\n  body\n    script(data-main = \"javascripts/gridstore\", src = \"javascripts/require-jquery.js\")");
      return res.send(fn(), 200);
    });
    app.post("/api/gridstore", function(req, res) {
      var file, fileData, reqFile, _results;
      fileData = [];
      if (req.files) {
        _results = [];
        for (reqFile in req.files) {
          file = req.files[reqFile];
          _results.push(writeGridFSFile(file, function(err, data) {
            if (err) {
              return res.send(err, 500);
            } else {
              return res.send(data, 200);
            }
          }));
        }
        return _results;
      } else {
        return res.send('No files uploaded', 500);
      }
    });
    app.get("/api/gridstore/:id", function(req, res) {
      var spec;
      spec = {
        _id: new BSON.ObjectID(req.params.id)
      };
      return db.collection("fs.files", function(err, collection) {
        if (err) {
          return res.send(err, 500);
        } else {
          return collection.find(spec, {}, function(err, cursor) {
            if (err) {
              return res.send(err, 500);
            } else {
              return cursor.toArray(function(err, docs) {
                var fileRef;
                if (err) {
                  return res.send(err, 500);
                } else {
                  if (docs) {
                    fileRef = docs[0];
                    res.contentType("application/json");
                    fileRef.filename = fileRef.orig_filename;
                    return res.send(fileRef);
                  }
                }
              });
            }
          });
        }
      });
    });
    app.get("/api/gridstore/:id/download", function(req, res) {
      var spec;
      spec = {
        _id: new BSON.ObjectID(req.params.id)
      };
      return db.collection("fs.files", function(err, collection) {
        if (err) {
          return res.send(err, 500);
        } else {
          return collection.find(spec, {}, function(err, cursor) {
            if (err) {
              return res.send(err, 500);
            } else {
              return cursor.toArray(function(err, docs) {
                var fileRef;
                if (err) {
                  return res.send(err, 500);
                } else {
                  if (docs) {
                    fileRef = docs[0];
                    return getGridFSFile(function(error, data) {
                      res.contentType(fileRef.contentType);
                      res.header("Content-Disposition", "inline; filename=\"" + fileRef.orig_filename + "\"");
                      return res.end(data);
                    }, req.params.id);
                  } else {
                    return res.send("Invlaid File Reference", 500);
                  }
                }
              });
            }
          });
        }
      });
    });
    app.post("/api/:collection/import", function(req, res) {
      var collectionName, gridResults;
      gridResults = parseExcel(req.files.spreadsheet.path);
      collectionName = req.params.collection;
      db.collection(collectionName, function(err, collection) {
        if (err) {
          return res.send(err, 500);
        } else {
          return _.each(gridResults, function(item) {
            return collection.insert(item);
          });
        }
      });
      return res.send(gridResults, 200);
    });
    app.get("/api/:collection/:id?", function(req, res) {
      var collectionName, o, options, query, test;
      query = (req.query.query ? JSON.parse(req.query.query) : {});
      if (req.params.id) {
        query = {
          _id: new BSON.ObjectID(req.params.id)
        };
      }
      options = req.params.options || {};
      test = ["limit", "sort", "fields", "skip", "hint", "explain", "snapshot", "timeout"];
      for (o in req.query) {
        if (test.indexOf(o) >= 0) options[o] = req.query[o];
      }
      collectionName = req.params.collection;
      return db.collection(collectionName, function(err, collection) {
        if (err) {
          return res.send(err, 500);
        } else {
          return collection.find(query, options, function(err, cursor) {
            if (err) {
              return res.send(err, 500);
            } else {
              return cursor.toArray(function(err, docs) {
                if (err) {
                  return res.send(err, 500);
                } else {
                  if (req.params.id && docs.length > 0) {
                    return res.send(docs[0], 200);
                  } else {
                    return res.send(docs, 200);
                  }
                }
              });
            }
          });
        }
      });
    });
    app.post("/api/:collection", function(req, res) {
      var collectionName;
      collectionName = req.params.collection;
      return db.collection(collectionName, function(err, collection) {
        if (err) {
          console.log(err);
          return res.send(err, 500);
        } else {
          return collection.insert(req.body, function(err, docs) {
            if (err) {
              console.log(err);
              return res.send(err, 500);
            } else {
              return res.send(docs[0], 201);
            }
          });
        }
      });
    });
    app.put("/api/:collection/:id", function(req, res) {
      var collectionName, spec;
      collectionName = req.params.collection;
      spec = {
        _id: new BSON.ObjectID(req.params.id)
      };
      return db.collection(collectionName, function(err, collection) {
        var prop, setSpec;
        if (err) {
          console.log(err);
          return res.send(err, 500);
        } else {
          setSpec = {};
          for (prop in req.body) {
            if (prop !== "_id") setSpec[prop] = req.body[prop];
          }
          return collection.update(spec, {
            $set: setSpec
          }, {
            safe: true
          }, function(err, docs) {
            if (err) {
              console.log(err);
              return res.send(err, 500);
            } else {
              return res.send(req.body, 200);
            }
          });
        }
      });
    });
    app["delete"]("/api/:collection/:id", function(req, res) {
      var collectionName, spec;
      collectionName = req.params.collection;
      spec = {
        _id: new BSON.ObjectID(req.params.id)
      };
      return db.collection(collectionName, function(err, collection) {
        if (err) {
          console.log(err);
          return res.send(err, 500);
        } else {
          return collection.remove(spec, function(err, result) {
            if (err) {
              console.log(err);
              return res.send(err, 500);
            } else {
              return res.send(result, 200);
            }
          });
        }
      });
    });
    console.log("Super Doc 2000 Server Started.");
    return app.listen(8088);
  });

}).call(this);
