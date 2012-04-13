define ["order!vendor/underscore", "order!vendor/backbone", "order!vendor/smoke.min", "order!app/icg/ui/uploader", "order!app/icg/ui/form-field", "order!app/icg/ui/section-panel","order!app/icg/ui/alert"], (i18n) ->


  class Nodoc.NestedModel extends Backbone.Model
    initialize: ->
      @nest()
      @bind "change", @nest, @

    nest: =>
      @objects = {}
      @collections = {}
      for property of @attributes
        if @attributes.hasOwnProperty(property)
          prop = @attributes[property] 
          switch prop.constructor.name
            when "Object"
              @objects[property] = new Nodoc.NestedModel(prop)
            when "Array"
              @collections[property] = new Nodoc.NestedCollection(prop)
    
    unnest: =>
      objects = {}
      for o of @objects
        @objects[o].unnest()
        objects[0] = @objects[o].toJSON()
      
      @set objects, silent:true

      for c of @collections
        collection = {}
        collectionArray = []
        for co in @collections[c].models
          co.unnest()
          collectionArray.push co.toJSON()
        collection[c] = collectionArray

        console.log collection
        @set collection, silent:true

    save: (attributes, options) =>
      @unnest()
      super(attributes, options)

  class Nodoc.NestedCollection extends Backbone.Collection
    model: Nodoc.NestedModel


  class Nodoc.Deployment extends Nodoc.NestedModel
    idAttribute: "_id"

    url: ->
      if @id
        "/api/deployments/#{@id}"
      else
        "/api/deployments"
    initialize: ->
      super()

  class Nodoc.Deployments extends Backbone.Collection
    model: Nodoc.Deployment
    url: "/api/deployments"



  class Nodoc.View extends Backbone.View
    templateHTML: """
      <div class="row>
        <div class="title"><%=name%></div>
        <div class='details-area'></div>
      </div>
    """

    renderFromLayout: (model, layout)=>
      $item = $ "<div></div>"
      for rowConfig in layout.rows
        $row = $("<div class='row'></div>")
        $item.append $row
        for fieldConfig in rowConfig.fields
          field = new ICG.UI.FormField fieldConfig
          fieldVal = ""
          fieldVal = (if fieldConfig.initialize then fieldConfig.initialize(model.get(fieldConfig.dataField)) else model.get(fieldConfig.dataField))  if model.get(fieldConfig.dataField)
          $(field.render().el).addClass fieldConfig.css
          if field.type is 'date'
            field.val new Date(Date.parse fieldVal)
          else 
            field.val fieldVal
          field.validate()
          if field.options.dataField
            field.on 'validChange', (eventField) ->
              fieldObj = {}
              fieldObj[eventField.options.dataField] = eventField.val()
              # fieldObj[@options.dataField] = @val()
              console.log model, fieldObj
              model.set (fieldObj)
              model
          $row.append field.el
      $item    

    removeModel: =>
      console.log "remove"
      @model?.collection?.remove(@model)
      @$el.html ''

  class Nodoc.DeploymentListView extends Nodoc.View
    templateHTML: """
      <div class="row">      
        <div  class="twelve phone-four columns">
          <div id="alert-area"></div>
          <div class="view-list-area"></div>
        </div>
      </div>  
    """

    className: "deployment-list-view"

    initialize: ->
      console.log @templateHTML
      @template = _.template(@templateHTML)
      @collection.bind "reset", @render, @
      @collection.bind "add", @render, @
      @collection.bind "remove", @render, @

    render: =>
      @$el.html @template()
      if @collection 
        for item in @collection.models
          sv = new Nodoc.DeploymentSummaryView(model:item)
          @$(".view-list-area").append sv.render().el
      @


  class Nodoc.DeploymentSummaryView extends Nodoc.View
    templateHTML: """
      <div class="row>
        <div class="title"><%=name%></div>
        <div class='details-area'></div>
        <div class="row">
          <div class="button-area right">
            <a class="green small button radius deployment-release"><i class="icon-cogs icon-large"></i>&nbsp;&nbsp;Release</a>
            <a class="small button radius deployment-edit"><i class="icon-edit icon-large"></i>&nbsp;&nbsp;Edit</a>
          </div>
        </div>
      </div>
    """

    layout: 
      rows: [ 
        fields: [
          label: "Name",
          dataField: "name"
          css: "six phone-two columns"
          readOnly:true
        ,
          label: "Github URL:",
          dataField: "repoUrl"
          css: "six phone-two columns"
          readOnly:true
        ]
      ]

    className: "statement-summary panel"

    events:
      "click .deployment-edit": "editDeployment"

    initialize: ->
      @template = _.template(@templateHTML)
      @model.bind "change", @render, @

    render: =>
      if @model and @layout
        @$el.html @template(@model.toJSON())
        @$(".details-area").html @renderFromLayout(@model, @layout)
      @

    editDeployment: =>
      App.router.navigate "deployment/#{@model.id}", {trigger:true}


  class Nodoc.DeploymentView extends Nodoc.View
    templateHTML: """
      <div class="row">
        <div class="eight columns">
          <a class="small button radius refresh"><i class="icon-refresh"></i> Refresh</a>
          <a class="green small button radius save"><i class="icon-ok"></i> Save</a>
        </div>
        <div class="four columns">
          <div class="right">
            <a class="red small button radius remove deployment"><i class="icon-minus"></i> Remove Deployment</a></a>
          </div>
        </div>
      </div>
      <div class="row">
        <div class='details-area'>
        </div>
        <div class="children">
          <div class='title applications'>Applications <a class="add application"><i class="icon-plus"></i> Add</a></div>  
          <div class='applications-area'></div>          
        </div>
      </div>
    """

    layout: 
      rows: [ 
        fields: [
          label: "Name",
          dataField: "name"
          css: "eight phone-two columns"
          required: true
        ,
          label: "Github URL:",
          dataField: "repoUrl"
          css: "eight phone-two columns"
          required: true        
        ]
      ]

    className: "deployment-view"

    events:
      "click .refresh": "refresh"
      "click .save": "save"
      "click .add.application": "addApplication"
      "click a.remove.deployment": "deleteDeployment"

    initialize: ->
      @template = _.template(@templateHTML)
      @model.bind "change", @render, @

    render: =>
      if @model and @layout
        @$el.html @template(@model.toJSON())
        @$(".details-area").html @renderFromLayout(@model, @layout)

        if @model.collections.applications
          for app in @model.collections.applications.models
            @renderApplication app      
      @

    refresh: =>
      @model.fetch
        success: =>
          @render()


    save: =>
      @model.save null, 
        success: =>
          console.log 'saved'
          alert = new ICG.UI.AlertView message:"Save Complete", autoDismiss:true
          @$el.prepend alert.render().el
        error: =>
          console.log 'error'
          alert = new ICG.UI.AlertView message:"Error on Save", autoDismiss:true
          @$el.prepend alert.render().el
    
    deleteDeployment: =>
      @model.destroy()
      App.router.navigate "deployments", trigger:true

    addApplication: =>
      m = new Nodoc.NestedModel()    
      @model.collections.applications ?= new Nodoc.NestedCollection()        
      @model.collections.applications.add m
      @renderApplication m

    renderApplication: (app) =>
        appView = new Nodoc.ApplicationView({model:app})
        @$(".applications-area").append appView.render().el



  class Nodoc.ApplicationView extends Nodoc.View
    templateHTML: """
      <div class="row">
        <div class='title instructions'>Details  <a class="remove application"> <i class="icon-minus"></i> Remove Application</a></div>
        <div class="app-area"></div>
        <div class="children">          
          <div class='title instructions'>Deployment Instructions <a class="add deployment-instruction"><i class="icon-plus"></i> Add</a></div>
          <div class='instructions-area'></div>
          <div class='title environments'>Environments <a class="add environment"> <i class="icon-plus"></i> Add</a></div>
          <div class='environments-area'></div>
        </div>
      </div>
    """

    layout: 
      rows: [ 
        fields: [
          label: "Name",
          dataField: "name"
          css: "eight phone-two columns"
          required: true
        ,
          label: "Description",
          dataField: "description"
          css: "twelve phone-two columns"
          required: true        
        ,
          label: "Repository Path",
          dataField: "repoPath"
          css: "eight phone-two columns"
          required: true        
        ,
          label: "List Files in Documentation",
          dataField: "listFiles"
          css: "four phone-two columns"
          list: [
            label: "Yes"
            value: true
          ,
            label: "No"
            value: false
          ]
          required: true        
        ]
      ]

    className: "application-view"

    events:
      "click .add.deployment-instruction": "addInstruction"
      "click .add.environment": "addEnvironment"
      "click a.remove.application": "removeModel"

    initialize: ->
      @template = _.template(@templateHTML)
      # @model.bind "change", @render, @

    render: =>
      console.log "render app"      
      if @model and @layout
        if @model.get('name') 
          state = 'closed'
        else 
          state = 'open'
        apSection = new ICG.UI.SectionPanel title:@model.get('name'), allowCollapse:true, initialState:state
        @$el.html apSection.render().el
        apSection.append @template(@model.toJSON())
        renderedContent = @renderFromLayout(@model, @layout)
        @$(".app-area").html renderedContent
        if @model.collections.deploymentInstructions
          for item in @model.collections.deploymentInstructions.models
            @renderInstruction item

        if @model.collections.environments
          for item in @model.collections.environments.models
            @renderEnvironment item
      @

    addInstruction: =>
      m = new Nodoc.NestedModel()
      @model.collections.deploymentInstructions ?= new Nodoc.NestedCollection()
      @model.collections.deploymentInstructions.add m
      @renderInstruction m

    renderInstruction: (item) =>
      itemView = new Nodoc.DeploymentInstructionView({model:item})
      @$(".instructions-area").append itemView.render().el

    addEnvironment: =>
      m = new Nodoc.NestedModel()
      @model.collections.environments ?= new Nodoc.NestedCollection()        
      @model.collections.environments.add m
      @renderEnvironment m

    renderEnvironment: (item) =>
      itemView = new Nodoc.EnvironmentView({model:item})
      @$(".environments-area").append itemView.render().el


  class Nodoc.DeploymentInstructionView extends Nodoc.View
    templateHTML: """
      <div class="row>
        <div class="title"><%=name%> <a class="remove instruction"> <i class="icon-minus"></i> Remove</a></div>
        <div class='details-area'></div>
      </div>
    """

    layout: 
      rows: [ 
        fields: [
          label: "Instruction",
          dataField: "text"
          css: "eight phone-two columns"
          required: true
        ]
      ]

    className: "application-view"

    events:
      "click a.remove.instruction": "removeModel"

    initialize: ->
      @template = _.template(@templateHTML)

    render: =>
      console.log "render di"

      if @model and @layout
        @$el.html @template(@model.toJSON())
        @$(".details-area").html @renderFromLayout(@model, @layout)

      @


  class Nodoc.EnvironmentView extends Nodoc.View
    templateHTML: """
      <div class="row>
        <div class="title"><%=name%> <a class="remove environment"> <i class="icon-minus"></i> Remove</a></div>
        <div class='details-area'>
        </div>
        <div class="children">          
          <div class='title instructions'>Environment Specific Instructions <a class="add env-deployment-instruction"><i class="icon-plus"></i> Add</a></div>
          <div class='instructions-area'></div>          
          <div class='title servers'>Servers <a class="add server"> <i class="icon-plus"></i> Add</a></div>
          <div class='servers-area'></div>
        </div>
      </div>
    """
    layout: 
      rows: [ 
        fields: [
          label: "Name",
          dataField: "name"
          css: "eight phone-two columns"
          required: true
        ,
          label: "Description",
          dataField: "description"
          css: "twelve phone-two columns"
          required: true        
        ,
          label: "Application Release Directory",
          dataField: "releasePath"
          css: "twelve phone-two columns"
          required: true
        ]
      ]

    className: "application-view"

    events:
      "click .add.server": "addServer"
      "click a.remove.environment": "removeModel"
      "click .add.env-deployment-instruction": "addInstruction"      

    initialize: ->
      @template = _.template(@templateHTML)


    render: =>
      console.log "render env"
      if @model and @layout
        @$el.html @template(@model.toJSON())
        @$(".details-area").html @renderFromLayout(@model, @layout)
        if @model.collections.deploymentInstructions
          for item in @model.collections.deploymentInstructions.models
            @renderInstruction item

        if @model.collections.servers
          for item in @model.collections.servers.models
            itemView = new Nodoc.ServerView({model:item})
            @$(".servers-area").append itemView.render().el

      @      

    addServer: =>
      m = new Nodoc.NestedModel()
      @model.collections.servers ?= new Nodoc.NestedCollection()              
      @model.collections.servers.add m
      @renderServer m

    renderServer: (item) =>
      itemView = new Nodoc.ServerView({model:item})
      @$(".servers-area").append itemView.render().el

    addInstruction: =>
      m = new Nodoc.NestedModel()
      @model.collections.deploymentInstructions ?= new Nodoc.NestedCollection()
      @model.collections.deploymentInstructions.add m
      @renderInstruction m

    renderInstruction: (item) =>
      itemView = new Nodoc.DeploymentInstructionView({model:item})
      @$(".instructions-area").append itemView.render().el


  class Nodoc.ServerView extends Nodoc.View
    templateHTML: """
      <div class="row>
        <div class="title"><%=name%> <a class="remove server"> <i class="icon-minus"></i> Remove</a></div>
        <div class='details-area'></div>
      </div>
    """

    layout: 
      rows: [ 
        fields: [
          label: "Name",
          dataField: "name"
          css: "four phone-two columns"
          validateOnKeyStroke: true
          required: true
        ,
          label: "IP Address",
          dataField: "name"
          css: "four phone-two columns"
          validateOnKeyStroke: true
          required: true
        ,
          label: "Target Path",
          dataField: "targetPath"
          css: "eight phone-two columns"
          validateOnKeyStroke: true
          required: true
        ]
      ]

    className: "application-view"

    events:
      "click a.remove.server": "removeModel"

    initialize: ->
      @template = _.template(@templateHTML)

    render: =>
      console.log "render server"
      if @model and @layout
        @$el.html @template(@model.toJSON())
        @$(".details-area").html @renderFromLayout(@model, @layout)

      @


  class Nodoc.Router extends Backbone.Router
    routes: 
      "new": "newDeployment"
      "deployments": "deploymentList"
      "deployment/:id": "showDeployment"
      "releases": "releases"
      "*default": "deploymentList"

    newDeployment: ->
      $('title').html "New Deployment"
      model = new Nodoc.Deployment()
      lv = new Nodoc.DeploymentView model:model
      $('.view-area').html lv.render().el

    showDeployment: (id) ->
      console.log id
      $('title').html "Edit Deployment"
      model = new Nodoc.Deployment _id:id
      model.fetch()
      lv = new Nodoc.DeploymentView model:model
      $('.view-area').html lv.render().el

    deploymentList: ->
      $('title').html "Deployment List"
      rc = new Nodoc.Deployments()
      rc.fetch()
      lv = new Nodoc.DeploymentListView collection:rc
      $('.view-area').html lv.render().el

    releases: ->
      $('title').html "Release History"
      ($ ".view-area").html ""

