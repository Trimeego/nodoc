(function() {

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone"], function(namespace, underscore, backbone) {
    var overlayTemplate;
    overlayTemplate = "<div>\n  <%=message%>\n</div>\n<img class=\"close-button\" style=\"display:none;\" src=\"/images/close.png\"></img>";
    return ICG.UI.OverlayView = Backbone.View.extend({
      className: "overlay-view",
      initialize: function(options) {
        return this._initialize(options);
      },
      _initialize: function(options) {
        return this.template = _.template(overlayTemplate);
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
