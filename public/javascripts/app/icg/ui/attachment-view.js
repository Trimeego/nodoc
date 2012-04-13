(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "order!vendor/jquery-ui.min", "app/icg/ui/image-viewer", "app/icg/ui/section-panel", "app/icg/ui/uploader"], function(namespace, underscore, backbone) {
    var attachmentViewTemplate, classMap;
    classMap = [
      {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        css: "excel-file"
      }, {
        contentType: "application/vnd.ms-excel",
        css: "excel-file"
      }, {
        contentType: "application/msword",
        css: "word-file"
      }, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        css: "word-file"
      }, {
        contentType: "application/pdf",
        css: "pdf-file"
      }, {
        contentType: "image/tiff",
        css: "tiff-file"
      }
    ];
    attachmentViewTemplate = "<div class=\"row\">\n  <div class=\"ten columns thumbnail-area\"></div>\n  <div class=\"two columns upload-area\"></div>\n</div>";
    ICG.UI.AttachmentView = (function(_super) {

      __extends(AttachmentView, _super);

      function AttachmentView() {
        this.render = __bind(this.render, this);
        AttachmentView.__super__.constructor.apply(this, arguments);
      }

      AttachmentView.prototype.className = "attachment-view";

      AttachmentView.prototype.initialize = function() {
        this.template = _.template(attachmentViewTemplate);
        this.collection.bind("all", function(event, obj) {
          return console.log(event, obj);
        });
        this.collection.bind("reset", this.render, this);
        return this.collection.bind("add", this.render, this);
      };

      AttachmentView.prototype.render = function() {
        var af, avt, renderedContent, _i, _len, _ref,
          _this = this;
        renderedContent = this.template();
        this.$el.html(renderedContent);
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          af = _ref[_i];
          avt = new ICG.UI.AttachmentViewThumbnail({
            model: af
          });
          this.$('.thumbnail-area').append(avt.render().el);
        }
        this.uploader = new ICG.UI.Uploader({
          trigger: "<a class=\"attachment-add-zone radius\">Click to Add</a>",
          url: "/api/gridstore"
        });
        this.$('.upload-area').html(this.uploader.render().el);
        this.uploader.bind("fileUploadComplete", function(file) {
          return _this.collection.add(file);
        });
        this.$('.upload-area').droppable({
          accept: ".attachment-thumbnail",
          greedy: true,
          hoverClass: "attachment-thumbnail-drop-hover",
          drop: function(event, ui) {
            var alreadyThere, attachment, file, _j, _len2, _ref2;
            file = ui.draggable.data('file');
            alreadyThere = false;
            _ref2 = _this.collection.models;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              attachment = _ref2[_j];
              if (attachment.get('_id') === file.get('_id')) {
                alreadyThere = true;
                break;
              }
            }
            if (!alreadyThere) return _this.collection.add(file);
          }
        });
        return this;
      };

      return AttachmentView;

    })(Backbone.View);
    return ICG.UI.AttachmentViewThumbnail = (function(_super) {

      __extends(AttachmentViewThumbnail, _super);

      function AttachmentViewThumbnail() {
        this.openAttachment = __bind(this.openAttachment, this);
        this.render = __bind(this.render, this);
        AttachmentViewThumbnail.__super__.constructor.apply(this, arguments);
      }

      AttachmentViewThumbnail.prototype.tagName = "a";

      AttachmentViewThumbnail.prototype.className = "attachment-thumbnail radius";

      AttachmentViewThumbnail.prototype.events = {
        "all": "openAttachment",
        "click": "openAttachment"
      };

      AttachmentViewThumbnail.prototype.render = function() {
        var c, css, type, _i, _len;
        this.$el.append("<div class=\"placeholder\">\n</div>\n<div class=\"filename\">\n  " + (this.model.get('filename')) + "\n</div>");
        type = this.model.get('contentType');
        console.log(type);
        for (_i = 0, _len = classMap.length; _i < _len; _i++) {
          c = classMap[_i];
          if (c.contentType === type) css = c.css;
        }
        if (css) {
          this.$el.addClass(css);
        } else {
          this.$el.addClass("unknown-file");
        }
        this.$el.draggable({
          revert: "invalid",
          helper: "clone"
        });
        this.$el.data('file', this.model);
        this.$el.attr('href', "/api/gridstore/" + (this.model.get('_id')) + "/download");
        this.$el.attr('target', "_blank");
        return this;
      };

      AttachmentViewThumbnail.prototype.openAttachment = function(event) {
        window.location.href = "/api/gridstore/" + (this.model.get('_id')) + "/download";
        return console.log("open sesame");
      };

      return AttachmentViewThumbnail;

    })(Backbone.View);
  });

}).call(this);
