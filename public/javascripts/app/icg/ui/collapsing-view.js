(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function(namespace, underscore, backbone) {
    return ICG.UI.CollapsingView = (function(_super) {

      __extends(CollapsingView, _super);

      function CollapsingView() {
        CollapsingView.__super__.constructor.apply(this, arguments);
      }

      CollapsingView.prototype.className = "collapsing-view row";

      CollapsingView.prototype.render = function() {
        var $this;
        $this = $(this.el);
        if (this.options.initialState === "closed") {
          $this.hide();
          this.state = "closed";
        } else {
          this.state = "open";
        }
        return this;
      };

      CollapsingView.prototype.expand = function(callback) {
        var self;
        self = this;
        $(this.el).slideDown(400, function() {
          self.state = "open";
          self.trigger("stateChange");
          if (callback) return callback.apply();
        });
        return this;
      };

      CollapsingView.prototype.collapse = function(callback) {
        var self;
        self = this;
        this.$el.slideUp(400, function() {
          self.state = "closed";
          self.trigger("stateChange");
          if (callback) return callback.apply();
        });
        return this;
      };

      CollapsingView.prototype.html = function(obj) {
        return $(this.el).html(obj);
      };

      CollapsingView.prototype.append = function(obj) {
        return $(this.el).append(obj);
      };

      return CollapsingView;

    })(Backbone.View);
  });

}).call(this);
