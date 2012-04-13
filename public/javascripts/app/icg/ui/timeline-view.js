(function() {

  define(["i18n!nls/properties", "order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "order!app/icg/models/workitem", "order!vendor/underscore", "order!vendor/backbone", "order!vendor/raphael", "order!vendor/raphael.scale", "app/icg/utils", "app/icg/ui/data-field"], function(i18n, namespace, underscore, backbone, workitem) {
    var timelineViewTemplate;
    timelineViewTemplate = "<div class=\"timeline-filter-controls six phone-four columns right\">\n    <input type=\"checkbox\" checked class=\"events-checkbox\">\n    <span class=\"custom checkbox\"></span> Events\n    <input type=\"checkbox\" checked class=\"approvals-checkbox\">\n    <span class=\"custom checkbox\"></span> Approvals\n    <input type=\"checkbox\" checked class=\"notes-checkbox\">\n    <span class=\"custom checkbox\"></span> Notes\n</div>\n<dl class=\"tabs\">\n  <dd class=\"active\"><a href=\"#\" class=\"grid-view-link\">Grid View</a></dd>\n  <dd><a href=\"#\" class=\"timeline-view-link\">TimeLine</a></dd>\n</dl>\n<ul class=\"content\">\n  <div class=\"active grid-view-area\" id=\"grid-<%=workID%>\">Grid Area</div>\n  <div class=\"inactive timeline-view-area\" id=\"timeline-<%=workID%>\"></div>\n</ul>";
    ICG.UI.TimelineView = Backbone.View.extend({
      className: "row timeline-view",
      defaults: {
        width: 600,
        height: 400,
        minHeight: 300,
        margin: 10,
        markerSize: 5,
        queueHeight: 60,
        titleWidth: 100,
        calloutWidth: 200,
        calloutHeight: 110,
        hiddenQueues: ["End of Workflow"],
        markers: {
          note: {
            fill: "yellow"
          },
          route: {
            fill: "orange"
          },
          save: {
            fill: "blue"
          },
          approval: {
            fill: "green"
          },
          event: {
            fill: "purple"
          }
        }
      },
      events: {
        "change .events-checkbox": "filterCollection",
        "change .notes-checkbox": "filterCollection",
        "change .approvals-checkbox": "filterCollection",
        "click .grid-view-link": "showGrid",
        "click .timeline-view-link": "showTimeline"
      },
      initialize: function() {
        _.bindAll(this, "render");
        _.bindAll(this, "resize");
        this.options = _.extend(this.defaults, this.options);
        if (!this.collection) throw "collection must be provided";
        this.collection.bind("reset", this.render);
        this.template = _.template(timelineViewTemplate);
        return $(window).resize(this.resize);
      },
      resize: function() {
        var $el;
        $el = this.$el;
        this.options.width = $el.width();
        if (this.paper && this.paper.changeSize) {
          return this.paper.changeSize(this.options.width, this.options.width / this.options.aspectRatio);
        }
      },
      showGrid: function(event) {
        event.preventDefault();
        this.$(".grid-view-area").show();
        this.$(".grid-view-area").removeClass("inactive");
        this.$(".timeline-view-area").hide();
        return this.$(".timeline-view-area").addClass("inactive");
      },
      showTimeline: function(event) {
        event.preventDefault();
        this.$(".grid-view-area").hide();
        this.$(".grid-view-area").addClass("inactive");
        this.$(".timeline-view-area").show();
        return this.$(".timeline-view-area").addClass("inactive");
      },
      render: function() {
        var self;
        self = this;
        this.$el.html(this.template({
          workID: this.collection.workID
        }));
        this.options.height = (this.collection.queues.length * this.options.queueHeight) + (this.options.margin * 2);
        if (this.options.height < this.options.minHeight) {
          this.options.height = this.options.minHeight;
        }
        this.options.aspectRatio = this.options.width / this.options.height;
        this.$("#timeline").css("width", this.options.width).css("height", this.options.height);
        this.$(".grid-view-area").html(new ICG.UI.TimelineListView({
          collection: this.collection
        }).render().el);
        return this;
      },
      filterCollection: function() {
        var self, visibility;
        self = this;
        visibility = {
          note: self.$(".notes-checkbox").attr("checked"),
          event: self.$(".events-checkbox").attr("checked"),
          save: self.$(".events-checkbox").attr("checked"),
          approval: self.$(".approval-checkbox").attr("checked")
        };
        this.collection.each(function(item) {
          if (visibility[item.get("type")]) {
            return item.setDisplayState("diplayed");
          } else {
            return item.setDisplayState("hidden");
          }
        });
        return this.draw();
      },
      draw: function() {
        var lastCoords, self;
        self = this;
        self.paper = Raphael(this.$(".timeline-view-area")[0], this.options.width, this.options.height);
        lastCoords = void 0;
        this.collection.queues.forEach(function(queue, index) {
          var path, queueText, queueY, seperator;
          if (self.options.hiddenQueues.lastIndexOf(queue) < 0) {
            queueY = (index * self.options.queueHeight) + self.options.margin;
            queueText = self.paper.text(self.options.margin, queueY + (self.options.queueHeight / 2), queue);
            queueText.attr({
              "text-anchor": "start",
              stroke: "#333",
              "font-size": 12
            });
            path = "M" + (self.options.margin + self.options.titleWidth - 20) + "," + (queueY + self.options.queueHeight) + "L" + self.options.width + "," + (queueY + self.options.queueHeight);
            seperator = self.paper.path(path);
            return seperator.attr({
              stroke: "#ccc"
            });
          }
        });
        this.collection.timeboxes().forEach(function(box, index) {
          var endX, queueY, startX, timebox;
          queueY = self.getQueueY(box.queue);
          startX = self.getDateX(box.start);
          endX = self.getDateX(box.end);
          timebox = self.paper.rect(startX, queueY, endX - startX, self.options.queueHeight, self.options.markerSize);
          return timebox.attr({
            "stroke-width": 0,
            fill: "#ddd"
          });
        });
        return this.collection.each(function(entry) {
          var circle, queue, x, xGap, y, yGap;
          queue = entry.get("queue");
          if (entry.displayState !== "hidden") {
            if (self.options.hiddenQueues.lastIndexOf(queue) < 0) {
              x = self.getDateX(entry.get("dt"));
              y = self.getQueueY(entry.get("queue")) + (self.options.markerSize * 4);
              if (lastCoords) {
                xGap = Math.abs(Math.abs(x) - Math.abs(lastCoords.x));
                yGap = Math.abs(Math.abs(y) - Math.abs(lastCoords.y));
                if (xGap < self.options.markerSize * 2 && yGap < self.options.markerSize * 2) {
                  y += self.options.markerSize * 2 + 2;
                }
              }
              circle = self.paper.circle(x, y, self.options.markerSize);
              circle.attr(self.options.markers[entry.get("type")]);
              circle.mousedown(function() {
                return self.markerCallout(entry);
              });
              lastCoords = {
                x: x,
                y: y
              };
              return entry.set({
                marker: circle
              }, {
                silent: true
              });
            }
          }
        });
      },
      getDateX: function(date) {
        var dateRange, pixelMS;
        if (this.collection.last() && this.collection.first()) {
          dateRange = this.collection.last().get("dt") - this.collection.first().get("dt");
          pixelMS = (this.options.width - (2 * this.options.margin) - this.options.titleWidth) / dateRange;
          return ((date - this.collection.first().get("dt")) * pixelMS) + this.options.margin + this.options.titleWidth;
        } else {
          return 0;
        }
      },
      getQueueY: function(queue) {
        return (this.collection.queues.indexOf(queue) * this.options.queueHeight) + this.options.margin;
      },
      hideCallout: function(callback) {
        var self;
        self = this;
        if (this.calloutSet) {
          return this.calloutSet.animate({
            opacity: 0
          }, 100, function() {
            self.calloutSet.remove();
            self.calloutSet = null;
            if (callback) return callback();
          });
        } else {
          if (callback) return callback();
        }
      },
      markerCallout: function(entry) {
        var self;
        self = this;
        return self.hideCallout(function() {
          var body, callout, calloutAnchor, calloutAnchorX, calloutAnchorY, calloutPath, calloutX, calloutY, circle, date, marker, outerCircle, title, user, x, y;
          self.paper.setStart();
          marker = entry.get("marker");
          x = marker.attrs.cx;
          y = marker.attrs.cy;
          calloutX = void 0;
          calloutY = void 0;
          calloutAnchorX = void 0;
          calloutAnchorY = void 0;
          if (x < self.options.width / 2) {
            calloutX = x + 20;
            calloutAnchorX = calloutX + 3;
          } else {
            calloutX = x - self.options.calloutWidth - 20;
            calloutAnchorX = calloutX + self.options.calloutWidth - 3;
          }
          if (y < self.options.height / 2) {
            calloutY = y + 20;
            calloutAnchorY = calloutY + 3;
          } else {
            calloutY = y - self.options.calloutHeight - 20;
            calloutAnchorY = calloutY + self.options.calloutHeight - 3;
          }
          calloutPath = "M" + x + "," + y + "L" + calloutAnchorX + "," + calloutAnchorY;
          calloutAnchor = self.paper.path(calloutPath);
          calloutAnchor.attr({
            "fill-opacity": .85,
            fill: "#000",
            "stroke-width": 6,
            stroke: "#000"
          });
          callout = self.paper.rect(calloutX, calloutY, self.options.calloutWidth, self.options.calloutHeight, 10);
          callout.attr({
            "fill-opacity": .85,
            fill: "#000",
            "stroke-width": 6,
            stroke: "#000"
          });
          outerCircle = self.paper.circle(x, y, self.options.markerSize + 4);
          outerCircle.attr({
            fill: "#000",
            "stroke-width": 0
          });
          circle = self.paper.circle(x, y, self.options.markerSize);
          circle.attr(self.options.markers[entry.get("type")]);
          circle.mousedown(function() {
            return self.hideCallout();
          });
          title = self.paper.text(calloutX + 10, calloutY + 15, entry.get("title"));
          title.attr({
            fill: "#ddd",
            "font-size": 14,
            "text-anchor": "start",
            stroke: "yellow"
          });
          body = self.paper.text(calloutX + 10, calloutY + 55, entry.get("body").wordWrap(self.options.width / 18, "\n", 3));
          body.attr({
            fill: "#ddd",
            "font-size": 12,
            "text-anchor": "start"
          });
          user = self.paper.text(calloutX + 10, calloutY + self.options.calloutHeight - 15, entry.get("user"));
          user.attr({
            fill: "#ddd",
            "font-size": 10,
            "text-anchor": "start"
          });
          date = self.paper.text(calloutX + self.options.calloutWidth - 10, calloutY + self.options.calloutHeight - 15, entry.get("formattedDate"));
          date.attr({
            fill: "#ddd",
            "font-size": 10,
            "text-anchor": "end"
          });
          self.calloutSet = self.paper.setFinish();
          self.calloutSet.attr({
            opacity: 0
          });
          return self.calloutSet.animate({
            opacity: 1
          }, 200);
        });
      }
    });
    ICG.UI.TimelineListView = Backbone.View.extend({
      initialize: function() {},
      render: function() {
        var $element;
        $element = this.$el.html("");
        this.collection.each(function(entry) {
          return $element.append(new ICG.UI.TimelineEntryView({
            model: entry
          }).render().el);
        });
        return this;
      }
    });
    return ICG.UI.TimelineEntryView = Backbone.View.extend({
      className: "row grid-entry",
      initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render, this);
        return this.model.bind("displayStateChange", this.adaptDisplay, this);
      },
      render: function() {
        var shouldDisplay;
        shouldDisplay = this.model.displayState !== "hidden";
        this.$el.html("");
        this.$el.append(new ICG.UI.DataField({
          label: "User",
          dataField: "user",
          readOnly: true,
          css: "six phone-two columns",
          value: this.model.get("user")
        }).render().el);
        this.$el.append(new ICG.UI.DataField({
          label: "Date",
          dataField: "date",
          readOnly: true,
          css: "six phone-two columns",
          value: this.model.get("formattedDate")
        }).render().el);
        this.$el.append(new ICG.UI.DataField({
          label: "Title",
          dataField: "title",
          readOnly: true,
          css: "twelve phone-two columns",
          value: this.model.get("title")
        }).render().el);
        this.$el.append(new ICG.UI.DataField({
          label: "Body",
          dataField: "body",
          readOnly: true,
          css: "twelve phone-two columns",
          value: this.model.get("body")
        }).render().el);
        if (!shouldDisplay) {
          this.$el.hide();
        } else {
          this.$el.show();
        }
        return this;
      },
      adaptDisplay: function() {
        if (this.model.displayState === "hidden") {
          return this.$el.slideUp(300);
        } else {
          return this.$el.slideDown(300);
        }
      }
    });
  });

}).call(this);
