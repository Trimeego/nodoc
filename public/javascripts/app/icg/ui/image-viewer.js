(function() {

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function(namespace, underscore, backbone) {
    var imageViewerTemplate, panDownRect, panLeftRect, panRightRect, panUpRect, zoomIn, zoomInRect, zoomOut, zoomOutRect, _lastViewRect;
    imageViewerTemplate = "<div class=\"toolbar\">\n  <div class=\"toolbar-button radius zoom-in\"></div>\n  <div class=\"toolbar-button radius zoom-out\"></div>\n  <div class=\"toolbar-button radius rotate-counter-clockwise\"></div>\n  <div class=\"toolbar-button radius rotate-clockwise\"></div>\n  <div class=\"toolbar-button radius pan-left\"></div>\n  <div class=\"toolbar-button radius pan-right\"></div>\n  <div class=\"toolbar-button radius pan-up\"></div>\n  <div class=\"toolbar-button radius pan-down\"></div>\n  <!--<div class=\"toolbar-button radius next-page\"></div>\n  <div class=\"toolbar-button radius previous-page\"></div>\n  <div class=\"toolbar-button radius right export-pdf\"></div>-->\n</div>\n<div class=\"image-holder\"></div>";
    _lastViewRect = void 0;
    zoomInRect = function(zoomPct) {
      var newHeight, newWidth, newX, newY;
      newWidth = zoomIn(_lastViewRect.width, zoomPct);
      newHeight = zoomIn(_lastViewRect.height, zoomPct);
      newX = _lastViewRect.x;
      newY = _lastViewRect.y;
      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      };
    };
    zoomOutRect = function(zoomPct) {
      var newHeight, newWidth, newX, newY;
      newWidth = zoomOut(_lastViewRect.width, zoomPct);
      newHeight = zoomOut(_lastViewRect.height, zoomPct);
      newX = _lastViewRect.x;
      newY = _lastViewRect.y;
      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      };
    };
    panLeftRect = function(panPct) {
      var newX;
      newX = _lastViewRect.x - (_lastViewRect.width * (panPct / 100));
      return {
        x: newX,
        y: _lastViewRect.y,
        width: _lastViewRect.width,
        height: _lastViewRect.height
      };
    };
    panRightRect = function(panPct) {
      var newX;
      newX = _lastViewRect.x + (_lastViewRect.width * (panPct / 100));
      return {
        x: newX,
        y: _lastViewRect.y,
        width: _lastViewRect.width,
        height: _lastViewRect.height
      };
    };
    panUpRect = function(panPct) {
      var newY;
      newY = _lastViewRect.y - (_lastViewRect.height * (panPct / 100));
      return {
        x: _lastViewRect.x,
        y: newY,
        width: _lastViewRect.width,
        height: _lastViewRect.height
      };
    };
    panDownRect = function(panPct) {
      var newY;
      newY = _lastViewRect.y + (_lastViewRect.height * (panPct / 100));
      return {
        x: _lastViewRect.x,
        y: newY,
        width: _lastViewRect.width,
        height: _lastViewRect.height
      };
    };
    zoomOut = function(currentSize, zoomPct) {
      return currentSize + (currentSize * (1 / (100 / zoomPct)));
    };
    zoomIn = function(currentSize, zoomPct) {
      return currentSize - (currentSize * (1 / (1 + (100 / zoomPct))));
    };
    return ICG.UI.ImageViewer = Backbone.View.extend({
      className: "image-viewer",
      events: {
        "click .zoom-in": "zoomIn",
        "click .zoom-out": "zoomOut",
        "click .rotate-counter-clockwise": "rotateCounterClockwise",
        "click .rotate-clockwise": "rotateClockwise",
        "click .pan-left": "panLeft",
        "click .pan-right": "panRight",
        "click .pan-up": "panUp",
        "click .pan-down": "panDown"
      },
      _initialize: function() {
        this.template = _.template(imageViewerTemplate);
        this.zoomLevel = 4;
        this.imageWidth = 0;
        this.imageHeight = 0;
        return this.imageOrientation = 0;
      },
      initialize: function() {
        return this._initialize();
      },
      _render: function() {
        $(this.el).html(this.template({}));
        return this;
      },
      render: function() {
        return this._render();
      },
      setViewBox: function(rect) {
        if (!this.paper) return;
        this.paper.setViewBox(rect.x, rect.y, rect.width, rect.height);
        return _lastViewRect = rect;
      },
      loadImage: function(url, options) {
        var self, _imageElement;
        self = this;
        if (!$(this.el).closest("html").length) {
          if (options && options.error) {
            return options.error("The element must be attached to the DOM prior to calling loadImage");
          }
        } else {
          if (!this.paper) {
            $(".image-holder", this.el).html("");
            this.paper = Raphael($(".image-holder", this.el)[0]);
            _imageElement = new Image();
            _imageElement.onload = function() {
              self.image = self.paper.image(this.src, 0, 0, _imageElement.width, _imageElement.height);
              self.setViewBox({
                x: 0,
                y: 0,
                width: _imageElement.width,
                height: _imageElement.height
              });
              if (options && options.success) return options.success(self.image);
            };
            return _imageElement.src = url;
          }
        }
      },
      zoomIn: function(event) {
        var zoomRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        this.zoomLevel += 1;
        zoomRect = zoomInRect(25);
        return this.setViewBox(zoomRect);
      },
      zoomOut: function(event) {
        var zoomRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        this.zoomLevel -= 1;
        zoomRect = zoomOutRect(25);
        return this.setViewBox(zoomRect);
      },
      rotateClockwise: function(event) {
        if (event) event.preventDefault();
        if (!this.image) return;
        if (this.imageOrientation === 3) {
          this.imageOrientation = 0;
        } else {
          this.imageOrientation += 1;
        }
        return this.image.rotate(90);
      },
      rotateCounterClockwise: function(event) {
        if (event) event.preventDefault();
        if (!this.image) return;
        if (this.imageOrientation === 0) {
          this.imageOrientation = 3;
        } else {
          this.imageOrientation -= 1;
        }
        return this.image.rotate(-90);
      },
      panLeft: function(event) {
        var panRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        panRect = panLeftRect(25);
        return this.setViewBox(panRect);
      },
      panRight: function(event) {
        var panRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        panRect = panRightRect(25);
        return this.setViewBox(panRect);
      },
      panUp: function(event) {
        var panRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        panRect = panUpRect(25);
        return this.setViewBox(panRect);
      },
      panDown: function(event) {
        var panRect;
        if (event) event.preventDefault();
        if (!this.image) return;
        panRect = panDownRect(25);
        return this.setViewBox(panRect);
      }
    });
  });

}).call(this);
