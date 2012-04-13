express = require("express")
http = require("http")
url = require("url")
io = require("socket.io")
fs = require("fs")
coffee = require("coffee-script")
_ = require("underscore")
jade = require('jade')
Db = require("mongodb").Db
GridStore = require("mongodb").GridStore
ObjectID = require("mongodb").ObjectID
Connection = require("mongodb").Connection
Server = require("mongodb").Server
BSON = require("mongodb").BSONPure
format = require("util").format
zipfile = require("zipfile")
parser = require("libxml-to-js")

app = express.createServer()
host = (if process.env["MONGO_NODE_DRIVER_HOST"]? then process.env["MONGO_NODE_DRIVER_HOST"] else "localhost")
port = (if process.env["MONGO_NODE_DRIVER_PORT"]? then process.env["MONGO_NODE_DRIVER_PORT"] else Connection.DEFAULT_PORT)

app.configure ->
  app.use express.methodOverride()
  app.use express.bodyParser()
  app.use app.router
  app.use express.static(__dirname + "/public")

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

db = new Db("nodoc", new Server(host, port, {}),
  native_parser: true
)

###
collections:
  deployments
    name
    environments
    servers
    deploymentId
  environments




###



db.open (err, db) ->
  app.get "/", (req, res) ->
    relativePath = "/"
    res.render "default", { id:req.params[1], theme:"new", relativePath:relativePath, layout: 'layout' }

  ###

    Loves specific functionality

  ###

  #Convert any JS requests on the fly using the underlying Coffeescript files
  ###

    D3 specific functionality

  ###

  #Convert any JS requests on the fly using the underlying Coffeescript files
  app.get /^\/?([A-Za-z0-9\-]*)\.js$/, (req, res) ->
    csFile = "#{__dirname}/views/coffee/#{req.params[0]}.coffee"
    content = coffee.compile fs.readFileSync csFile, 'utf8'
    res.send content, 200

  app.get /^\/*([^\.^\/]*)(?:\/(.*))?$/, (req, res, next) ->
    if req.params[0] is "" or req.params[0] is "stylesheets" or req.params[0] is "javascripts" or  req.params[0] is "api" or  req.params[0] is "images"
      next()
    else
      relativePath = ("../" for i in req.params).join('')
      res.render "#{req.params[0]}", { id:req.params[1], theme:"new", relativePath:relativePath, layout: 'layout' }


  ###

  Generic Demo functionality

  ###


  getGridFSFile = (callback,id) ->
    gs = new GridStore db, new ObjectID(id), 'r'
    gs.open (err,gs) -> 
      gs.read(callback)

  writeGridFSFile = (file, callback) ->
    objID = new ObjectID()
    gs = new GridStore db, objID, "w"
    gs.open (err, gridStore) ->
      if err
        callback(err, gridStore)
      else
        readStream = fs.createReadStream file.path
        readStream.on 'data', (data) -> 
          gs.write data, 
             "content_type": file.type
          , (err) ->

        readStream.on 'end', ->
          gs.close (err, result) ->
            if err
              console.log err
              callback(err, result)
            else 
              db.collection "fs.files", (err, collection) ->
                collection.update {_id:result._id}, {$set:{contentType:file.type, orig_filename: file.name}}

              result.contentType = file.type
              result.filename = file.name
              callback(err, result)

  app.get "/gridstore", (req, res) ->
    fn = jade.compile("""
      !!!
      html
        head
        body
          script(data-main = "javascripts/gridstore", src = "javascripts/require-jquery.js")
    """);
    res.send fn(), 200

  app.post "/api/gridstore", (req, res) ->
    fileData = []
    if req.files
      for reqFile of req.files
        file = req.files[reqFile]
        writeGridFSFile file, (err, data) ->
          if err
            res.send err, 500
          else
            res.send data, 200

    else
      res.send 'No files uploaded', 500

  

  app.get "/api/gridstore/:id", (req, res) ->
    spec = _id: new BSON.ObjectID(req.params.id)    
    db.collection "fs.files", (err, collection) ->
      if err
        res.send err, 500
      else
        collection.find spec, {}, (err, cursor) ->
          if err
            res.send err, 500    
          else
            cursor.toArray (err, docs) ->
              if err
                res.send err, 500    
              else
                if docs
                  fileRef = docs[0]
                  res.contentType("application/json")
                  fileRef.filename = fileRef.orig_filename
                  res.send fileRef


  app.get "/api/gridstore/:id/download", (req, res) ->
    spec = _id: new BSON.ObjectID(req.params.id)    
    db.collection "fs.files", (err, collection) ->
      if err
        res.send err, 500
      else
        collection.find spec, {}, (err, cursor) ->
          if err
            res.send err, 500    
          else
            cursor.toArray (err, docs) ->
              if err
                res.send err, 500    
              else
                if docs
                  fileRef = docs[0]
                  getGridFSFile (error,data) -> 
                    res.contentType(fileRef.contentType)
                    res.header "Content-Disposition", "inline; filename=\"#{fileRef.orig_filename}\""
                    res.end data
                  , req.params.id
                else
                  res.send "Invlaid File Reference", 500    


  app.post "/api/:collection/import", (req, res) ->
    gridResults = parseExcel(req.files.spreadsheet.path)
    collectionName = req.params.collection
    db.collection collectionName, (err, collection) ->
      if err
        res.send err, 500
      else
        _.each gridResults, (item) ->
          collection.insert item

    res.send gridResults, 200

  app.get "/api/:collection/:id?", (req, res) ->
    query = (if req.query.query then JSON.parse(req.query.query) else {})
    query = _id: new BSON.ObjectID(req.params.id)  if req.params.id
    options = req.params.options or {}
    test = [ "limit", "sort", "fields", "skip", "hint", "explain", "snapshot", "timeout" ]
    for o of req.query
      options[o] = req.query[o]  if test.indexOf(o) >= 0
    collectionName = req.params.collection
    db.collection collectionName, (err, collection) ->
      if err
        res.send err, 500
      else
        collection.find query, options, (err, cursor) ->
          if err
            res.send err, 500
          else
            cursor.toArray (err, docs) ->
              if err
                res.send err, 500
              else
                if req.params.id and docs.length > 0
                  res.send docs[0], 200
                else
                  res.send docs, 200


  app.post "/api/:collection", (req, res) ->
    collectionName = req.params.collection
    db.collection collectionName, (err, collection) ->
      if err
        console.log err
        res.send err, 500
      else
        collection.insert req.body, (err, docs) ->
          if err
            console.log err
            res.send err, 500
          else
            res.send docs[0], 201
            

  app.put "/api/:collection/:id", (req, res) ->
    collectionName = req.params.collection
    spec = _id: new BSON.ObjectID(req.params.id)
    db.collection collectionName, (err, collection) ->
      if err
        console.log err
        res.send err, 500
      else
        setSpec = {}
        for prop of req.body
          setSpec[prop] = req.body[prop]  if prop isnt "_id"
        collection.update spec,
          $set: setSpec
        ,
          safe: true
        , (err, docs) ->
          if err
            console.log err
            res.send err, 500
          else
            res.send req.body, 200

  app.delete "/api/:collection/:id", (req, res) ->
    collectionName = req.params.collection
    spec = _id: new BSON.ObjectID(req.params.id)
    db.collection collectionName, (err, collection) ->
      if err
        console.log err
        res.send err, 500
      else
        collection.remove spec, (err, result) ->
          if err
            console.log err
            res.send err, 500
          else
            res.send result, 200

  console.log "Super Doc 2000 Server Started."
  app.listen 8080