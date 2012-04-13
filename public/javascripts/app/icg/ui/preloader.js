(function() {

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function(namespace, underscore, backbone) {
    var preloaderTemplate;
    preloaderTemplate = "<div class=\"preloader overlay-view\">\n  <img src=\"/images/ajax-loader.gif\"></img>&nbsp;<%= message %>\n</div>  ";
    return ICG.UI.PreloaderView = Backbone.View.extend({
      className: "preloader",
      initialize: function(options) {
        return this._initialize(options);
      },
      _initialize: function(options) {
        return this.template = _.template(preloaderTemplate);
      },
      events: {
        "click .close-button": "dismissOverlay"
      },
      render: function() {
        return this._render();
      },
      _render: function() {
        var $closeButton, renderedContent;
        renderedContent = this.template(this.options);
        this.$el.html(renderedContent);
        if (this.options.closeButton) {
          $closeButton = $(".close-button", this.el);
          $closeButton.show();
        }
        return this;
      },
      dismissOverlay: function() {
        this.trigger("dismissOverlay", this);
        return this.$el.fadeOut();
      }
    });
  });

}).call(this);
