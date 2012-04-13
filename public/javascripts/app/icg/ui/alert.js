(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function() {
    return ICG.UI.AlertView = (function(_super) {

      __extends(AlertView, _super);

      function AlertView() {
        this.triggerClickEvent = __bind(this.triggerClickEvent, this);
        AlertView.__super__.constructor.apply(this, arguments);
      }

      AlertView.prototype.className = "alert-box";

      AlertView.prototype.events = {
        "click a.close": "closeAlert",
        "click": "triggerClickEvent"
      };

      AlertView.prototype.initialize = function() {};

      AlertView.prototype.render = function() {
        var $this, renderedContent, self;
        renderedContent = this.options.message;
        $this = $(this.el);
        self = this;
        $this.html(renderedContent);
        if (this.options.closeButton) {
          $this.append("<a href=\"\" class=\"close\">&times;</a>");
        }
        if (this.options.autoDismiss) {
          setTimeout((function() {
            return self.closeAlert();
          }), 5000);
        }
        return this;
      };

      AlertView.prototype.closeAlert = function(event) {
        var $this;
        if (event) event.preventDefault();
        $this = $(this.el);
        return $this.slideUp(function() {
          return $this.remove();
        });
      };

      AlertView.prototype.triggerClickEvent = function() {
        return this.trigger('click', this);
      };

      return AlertView;

    })(Backbone.View);
  });

}).call(this);
