(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["i18n!nls/properties", "order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "app/icg/ui/data-field", "app/icg/ui/collapsing-view", "app/icg/ui/section-panel"], function(i18n, namespace, underscore, backbone) {
    var glContainerTemplate, glLineItemTemplate;
    glContainerTemplate = "<div class='row'>\n  <div class=\" twelve phone-four columns\">\n    <label class='gl-title'></label>\n    <div class=\"right gl-action-bar\">\n      <a class=\"gl-show-favorite actionButton\">Show Favorites</a>&nbsp;|\n      <a class=\"gl-add actionButton\">Add New</a>\n    </div>\n  </div>\n</div>\n\n<div class=\"row\">\n  <div class=\"twelve columns gl-content\" />\n</div>\n\n<div class=\"row gl-summary-section\">\n  <div class=\"gl-summary-amount-title right\">Total GL Amount: $&nbsp;<span class=\"gl-summary-amount-value\" /> </div>\n</div>";
    glLineItemTemplate = "<div class=\"row\">\n  <div class=\"row\">\n    <div class=\"gl-row-content\" />\n  </div>\n  <div class=\"row\">\n    <div class=\"gl-row-extended\" />\n  </div>\n  <div class=\"gl-more-row\">\n    <a class=\"gl-more-button\">More</a>\n  </div>\n</div>";
    ICG.UI.GLView = (function(_super) {

      __extends(GLView, _super);

      function GLView() {
        GLView.__super__.constructor.apply(this, arguments);
      }

      GLView.prototype.className = "gl-view row";

      GLView.prototype.events = {
        "click a.gl-add": "addGL"
      };

      GLView.prototype.initialize = function() {
        this.template = _.template(glContainerTemplate);
        if (!this.options) this.options = {};
        if (!this.options.fieldConfig) {
          this.options.fieldConfig = {};
          this.options.fieldConfig.extendedFields = {};
        }
        if (!this.collection) throw "Invalid Collection";
        if (!this.options.summaryField) this.options.summaryField = "GL_AMT";
        this.collection.bind("add", this.render, this);
        this.collection.bind("add", this.added, this);
        this.collection.bind("reset", this.render, this);
        this.collection.bind("remove", this.render, this);
        this.collection.bind("fetch", this.stateChange, this);
        this.collection.bind("change", this.setTotalDistribution, this);
        if (!this.options.fieldConfig.primaryFields) {
          this.options.fieldConfig.primaryFields = [
            {
              label: "Acct Code",
              dataField: "GL_ACCT_CODE",
              css: "two columns"
            }, {
              label: "GL Sub Account",
              dataField: "GL_SUB_ACCT",
              css: "two columns"
            }, {
              label: "Property",
              dataField: "GL_BUS_UNIT",
              css: "two columns"
            }, {
              label: "Chrg. Property",
              dataField: "CHRG_BUS_UNIT",
              css: "two columns"
            }, {
              label: "Dept.",
              dataField: "GL_DEPT",
              css: "two columns"
            }, {
              label: "Division",
              dataField: "GL_DIV",
              css: "two columns"
            }, {
              label: "Description",
              dataField: "GL_DESC",
              css: "two columns"
            }, {
              label: "GL Amount",
              dataField: "GL_AMT",
              css: "two columns"
            }
          ];
          return this.options.fieldConfig.extendedFields = {
            fields: [
              {
                label: "Proj. Number",
                dataField: "GL_PROJECT_ID",
                css: "two columns"
              }, {
                label: "Activity",
                dataField: "ACTIVITY",
                css: "two columns"
              }, {
                label: "Cost Code",
                dataField: "COST_CODE",
                css: "two columns"
              }, {
                label: "Job Code",
                dataField: "JOB_CODE",
                css: "two columns"
              }, {
                label: "Proj. Routing",
                dataField: "PROJ_ROUTING",
                css: "two columns"
              }
            ]
          };
        }
      };

      GLView.prototype.addGL = function(event) {
        return this.collection.add({});
      };

      GLView.prototype.stateChange = function(event) {
        return this.setState(this.collection.state);
      };

      GLView.prototype.setState = function(state) {
        this.$(".gl-status").remove();
        switch (state) {
          case "fetching":
            return this.$(".gl-content").append("<div class=\"row\"><div class=\"gl-status fetching \">Fetching...</div></div>");
          case "loading":
            return this.$(".gl-content").append("<div class=\"row\"><div class=\"gl-status loading \">Loading...</div></div>");
          case "error":
            return this.$(".gl-content").append("<div class=\"row\"><div class=\"gl-status error \">Error fetching GL Detail...</div></div>");
          case "no-gl":
            return this.$(".gl-content").append("<div class=\"row\"><div class=\"gl-status no-gl-lines\">This item has no GL lines</div></div>");
        }
      };

      GLView.prototype.setTotalDistribution = function() {
        var totalGLAmount;
        totalGLAmount = 0;
        _.each(this.collection.models, function(item) {
          return totalGLAmount += new Number(item.get("GL_AMT") || "0");
        });
        return this.$(".gl-summary-amount-value").html(totalGLAmount.toFixed(2));
      };

      GLView.prototype.added = function() {
        return this.$(".gl-summary-section").removeClass("hidden");
      };

      GLView.prototype.render = function() {
        var $this, glSection, renderedContent, self;
        renderedContent = this.template(this.options);
        self = this;
        $this = $(this.el);
        $this.html(renderedContent);
        glSection = new ICG.UI.CollapsingView({
          title: "GL Detail",
          initialState: "open"
        });
        this.$(".gl-content", self.el).append(glSection.render().el);
        if (self.options.readOnly) this.$(".gl-action-bar").addClass("hidden");
        if (this.collection.models.length > 0) {
          this.collection.each(function(item, idx) {
            var $renderedLine, lineView, options;
            options = {};
            options.model = item;
            options.fieldConfig = self.options.fieldConfig;
            options.readOnly = self.options.readOnly;
            lineView = new ICG.UI.GLLineView(options);
            lineView.model.bind("change", self.setTotalDistribution, self);
            $renderedLine = $(lineView.render().el);
            if (idx % 2 === 0) {
              $renderedLine.addClass("even");
            } else {
              $renderedLine.addClass("odd");
            }
            return glSection.append($renderedLine);
          });
          self.setTotalDistribution();
        } else {
          self.setState("no-gl");
          this.$(".gl-summary-section").html("");
        }
        this.trigger("renderComplete");
        return this;
      };

      return GLView;

    })(Backbone.View);
    return ICG.UI.GLLineView = (function(_super) {

      __extends(GLLineView, _super);

      function GLLineView() {
        this.render = __bind(this.render, this);
        GLLineView.__super__.constructor.apply(this, arguments);
      }

      GLLineView.prototype.className = "gl-item radius";

      GLLineView.prototype.events = {
        "click a.gl-more-button": "toggleExtendedFields"
      };

      GLLineView.prototype.initialize = function() {
        return this.template = _.template(glLineItemTemplate);
      };

      GLLineView.prototype.glDataChanged = function(event) {
        var setOpt;
        setOpt = {};
        setOpt[event.options.dataField] = event.val();
        return this.model.set(setOpt);
      };

      GLLineView.prototype.toggleExtendedFields = function() {
        var $glMore;
        $glMore = this.$("a.gl-more-button");
        if (this.extendedSection.state === "closed") {
          $glMore.html("<div class=\"less-gl-icon\"></div>&nbsp;Hide Details");
          return this.extendedSection.expand();
        } else {
          $glMore.html("<div class=\"more-gl-icon\"></div>&nbsp;More");
          return this.extendedSection.collapse();
        }
      };

      GLLineView.prototype.render = function() {
        var df, field, renderedContent, _i, _j, _len, _len2, _ref, _ref2;
        renderedContent = this.template(this.model.toJSON());
        df = void 0;
        $(this.el).html(renderedContent);
        _ref = this.options.fieldConfig.primaryFields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          field.value = this.model.get(field.dataField);
          field.readOnly = this.options.readOnly || false;
          df = new ICG.UI.FormField(field);
          this.$(".gl-row-content").append(df.render().el);
          df.validate();
          df.bind("validChange", this.glDataChanged, this);
        }
        if (this.options.fieldConfig.extendedFields && this.options.fieldConfig.extendedFields.fields) {
          this.extendedSection = new ICG.UI.CollapsingView({
            initialState: this.options.fieldConfig.extendedFields.initialState || "closed"
          });
          this.$(".gl-row-extended").append(this.extendedSection.render().el);
          _ref2 = this.options.fieldConfig.extendedFields.fields;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            field = _ref2[_j];
            field.value = this.model.get(field.dataField);
            field.readOnly = this.options.readOnly || false;
            df = new ICG.UI.FormField(field);
            this.extendedSection.append(df.render().el);
            df.validate();
            df.bind("validChange", this.glDataChanged, this);
          }
          if (this.options.fieldConfig.extendedFields.fields.length === 0) {
            this.$("div.gl-more-row").hide();
          }
        }
        return this;
      };

      return GLLineView;

    })(Backbone.View);
  });

}).call(this);
