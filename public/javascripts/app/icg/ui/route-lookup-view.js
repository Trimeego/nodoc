(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "order!app/icg/ui/lookup-view", "order!app/icg/ui/data-field"], function(namespace, underscore, backbone, lookupView) {
    var routeLookupTemplate, routeOptions;
    routeLookupTemplate = "<div class=\"\">\n  <div class=\"title\">Route Work Item</div>\n  <div class=\"prompt\">Please select the are to which you would like to route the work item and select a routing reason.</div>\n  <div class=\"route-to-area\"></div>      \n  <div class=\"route-reason-area\"></div>      \n  <div class=\"data-field\">\n    <label>Comment</label>\n    <div>\n      <textarea></textarea>     \n    </div>\n  </div>      \n</div>    \n<div class='buttons'>\n  <a class=\"nice small button radius route-lookup-route\">Route</a>\n  <a class=\"nice small button radius red route-lookup-cancel\">Cancel</a>\n</div>";
    routeOptions = [
      {
        label: "Route 1",
        value: "r1",
        reasons: [
          {
            label: "Reason 1 - 1",
            value: "r11",
            requiresComment: false
          }, {
            label: "Reason 1 - 2",
            value: "r12",
            requiresComment: false
          }
        ]
      }, {
        label: "Route 2",
        value: "r2",
        reasons: [
          {
            label: "Reason 2 - 1",
            value: "r21",
            requiresComment: true
          }, {
            label: "Reason 2 - 2",
            value: "r22",
            requiresComment: true
          }
        ]
      }
    ];
    return ICG.UI.RouteLookupView = (function(_super) {

      __extends(RouteLookupView, _super);

      function RouteLookupView() {
        this.render = __bind(this.render, this);
        this.display = __bind(this.display, this);
        RouteLookupView.__super__.constructor.apply(this, arguments);
      }

      RouteLookupView.prototype.className = "route-to reveal-modal";

      RouteLookupView.prototype.initialize = function(options) {
        var _base;
        this.options.closeButton = false;
        if ((_base = this.options).routeOptions == null) {
          _base.routeOptions = routeOptions;
        }
        this.routeTo = null;
        this.routeReason = null;
        return this.template = _.template(routeLookupTemplate);
      };

      RouteLookupView.prototype.events = {
        "click .route-lookup-cancel": "cancelRoute",
        "click .route-lookup-route": "completeRoute"
      };

      RouteLookupView.prototype.display = function() {
        return this.$el.reveal({
          closeOnBackgroundClick: true
        });
      };

      RouteLookupView.prototype.render = function() {
        var reasonField, route, routeField, routeList,
          _this = this;
        this.$el.html(this.template({}));
        routeList = (function() {
          var _i, _len, _ref, _results;
          _ref = this.options.routeOptions;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            route = _ref[_i];
            _results.push({
              label: route.label,
              value: route.value
            });
          }
          return _results;
        }).call(this);
        console.log(routeList);
        routeField = new ICG.UI.DataField({
          label: "Route To",
          dataField: "routeTo",
          value: this.routeTo,
          type: "radio",
          list: routeList
        });
        routeField.bind("validChange", function(field) {
          _this.routeTo = field.val();
          return _this.render();
        });
        this.$('.route-to-area').append(routeField.render().el);
        if (this.routeTo) {
          reasonField = new ICG.UI.DataField;
          ({
            label: "Route Reason",
            dataField: "routeReason",
            value: this.routeTo,
            type: "radio"
          });
          reasonField.bind("validChange", function(field) {
            _this.routeReason = field.val();
            return _this.render;
          });
          this.$('.route-reason-area').html(reasonField.render().el);
        } else {
          this.$('.route-reason-area').html('');
        }
        return this;
      };

      RouteLookupView.prototype.completeRoute = function(results) {
        this.trigger("lookupComplete", results);
        return this.dismissModal();
      };

      RouteLookupView.prototype.cancelRoute = function() {
        this.trigger("lookupCancelled");
        return this.dismissModal();
      };

      RouteLookupView.prototype.dismissModal = function() {
        this.$el.trigger('reveal:close');
        return this.$el.remove();
      };

      return RouteLookupView;

    })(Backbone.View);
  });

}).call(this);
