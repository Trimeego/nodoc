(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "order!vendor/jquery.reveal"], function(namespace, underscore, backbone) {
    var lookupTemplate;
    lookupTemplate = "<div class=\"lookup-content reveal-modal\">\n  \n</div>\n<img class=\"close-button\" style=\"display:none;\" src=\"/images/close.png\"></img>";
    return ICG.UI.LookupView = (function(_super) {

      __extends(LookupView, _super);

      function LookupView() {
        this.display = __bind(this.display, this);
        LookupView.__super__.constructor.apply(this, arguments);
      }

      LookupView.prototype.initialize = function(options) {
        return this.template = _.template(lookupTemplate);
      };

      LookupView.prototype.render = function() {
        var $closeButton, renderedContent;
        renderedContent = this.template(this.options);
        this.$el.html(renderedContent);
        if (this.options.closeButton) {
          $closeButton = $(".close-button", this.el);
          $closeButton.show();
        }
        return this;
      };

      LookupView.prototype.display = function() {
        return this.$('.lookupContent').reveal({
          closeOnBackgroundClick: true
        });
      };

      LookupView.prototype.completeLookup = function(results) {
        this.trigger("lookupComplete", results);
        return this.dismissLookup();
      };

      LookupView.prototype.cancelLookup = function() {
        this.trigger("lookupCancelled");
        return this.dismissLookup();
      };

      LookupView.prototype.dismissLookup = function() {
        return this.$el.remove();
      };

      return LookupView;

    })(Backbone.View);
  });

}).call(this);
