(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function(namespace, underscore, backbone) {
    var sectionPanelTemplate;
    sectionPanelTemplate = "<div class=\"title-bar\">​\n  <div class=\"section-title\"><%=title%></div>​\n  <div class=\"collapse-button\">​</div>​\n</div>​\n<div class=\"panel-content row\">​\n</div>​";
    return ICG.UI.SectionPanel = (function(_super) {

      __extends(SectionPanel, _super);

      function SectionPanel() {
        SectionPanel.__super__.constructor.apply(this, arguments);
      }

      SectionPanel.prototype.className = "section-panel panel row";

      SectionPanel.prototype.events = {
        "click div.expand-button": "expand",
        "click div.collapse-button": "collapse"
      };

      SectionPanel.prototype.initialize = function() {
        this.template = _.template(sectionPanelTemplate);
        this.options.title || (this.options.title = "");
        if (this.options.initialState === "closed") {
          return this.options.allowCollapse = true;
        }
      };

      SectionPanel.prototype.render = function() {
        var $this, renderedContent;
        renderedContent = this.template(this.options);
        $this = $(this.el);
        $this.html(renderedContent);
        if (this.options.initialState === "closed") {
          this.$("div.panel-content").hide();
          this.$("div.collapse-button").removeClass("collapse-button").addClass("expand-button");
        }
        if (this.options.allowCollapse === false) {
          this.$("div.collapse-button").hide();
        }
        return this;
      };

      SectionPanel.prototype.expand = function() {
        var self;
        self = this;
        this.$("div.panel-content").slideDown(400, function() {
          return self.$("div.expand-button").removeClass("expand-button").addClass("collapse-button");
        });
        return this;
      };

      SectionPanel.prototype.collapse = function() {
        var self;
        self = this;
        this.$("div.panel-content").slideUp(400, function() {
          return self.$("div.collapse-button").removeClass("collapse-button").addClass("expand-button");
        });
        return this;
      };

      SectionPanel.prototype.html = function(obj) {
        return this.$("div.panel-content").html(obj);
      };

      SectionPanel.prototype.append = function(obj) {
        return this.$("div.panel-content").append(obj);
      };

      SectionPanel.prototype.prepend = function(obj) {
        return this.$("div.panel-content").prepend(obj);
      };

      return SectionPanel;

    })(Backbone.View);
  });

}).call(this);
