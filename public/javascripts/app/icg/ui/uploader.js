(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "order!vendor/jquery.form"], function() {
    return ICG.UI.Uploader = (function(_super) {

      __extends(Uploader, _super);

      function Uploader() {
        this.selectFile = __bind(this.selectFile, this);
        this.render = __bind(this.render, this);
        Uploader.__super__.constructor.apply(this, arguments);
      }

      Uploader.prototype.initialize = function() {
        var _base, _ref;
        this.uploadedFiles = [];
        return (_ref = (_base = this.options).trigger) != null ? _ref : _base.trigger = "<a href=\"\">Upload File</a>";
      };

      Uploader.prototype.render = function() {
        var _this = this;
        this.$el.html("<form action='" + this.options.url + "' class='upload-form' enctype='multipart/form-data' method='post'>\n  <div class='hidden-file'>\n    <input class=\"uploader-file\" name='file' type='file'  accept=\"application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/tiff\" style='position: absolute; x: -2000px; width: 0px; height: 0px; overflow: hidden;'>\n  </div>\n</form>");
        this.$el.append("<div class=\"upload-button\">" + this.options.trigger + "</div>");
        this.$(".upload-form").ajaxForm({
          beforeSubmit: function(a, f, o) {},
          success: function(data) {
            _this.uploadedFiles.push(data);
            return _this.trigger("fileUploadComplete", data);
          },
          error: function(error) {
            console.log(error);
            return _this.trigger("fileUploadError", error);
          }
        });
        this.$('.uploader-file').change(function(event) {
          event.preventDefault();
          _this.trigger("fileSelected", event);
          return _this.$('.upload-form').submit();
        });
        this.$('.upload-button').click(function(event) {
          event.preventDefault();
          _this.selectFile();
          return _this.trigger("fileUploadStart", event);
        });
        return this;
      };

      Uploader.prototype.selectFile = function() {
        return this.$('.uploader-file').click();
      };

      return Uploader;

    })(Backbone.View);
  });

}).call(this);
