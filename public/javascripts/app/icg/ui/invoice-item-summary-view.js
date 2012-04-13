(function() {

  define(["i18n!nls/properties", "order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "app/icg/ui/collapsing-view", "app/icg/ui/gl-view", "app/icg/ui/timeline-view", "app/icg/ui/attachment-view", "app/icg/ui/data-field", "app/icg/ui/overlay-view", "app/icg/ui/alert"], function(i18n, namespace, underscore, backbone) {
    var glFieldConfig, layoutConfig, summaryActionTemplate, viewTemplate;
    viewTemplate = "<div class=\"panel item-view\"> \n  <div class=\"row\">\n    <div class=\"alert-area\">\n    </div>\n  </div>    \n  <div class=\"row\">\n    <div class=\"twelve phone-four columns header-area\">\n    </div>\n  </div>\n  <div class=\"row\">\n    <div class=\"item-view-controls\">\n      <dl class=\"sub-nav right\">\n        <dd><a href=\"#\" class=\"command show-gl\"><%=i18n.gl_button_label%></a></dd>\n        <dd><a href=\"#\" class=\"command show-timeline\"> <%=i18n.timeline_button_label%></a></dd>\n        <dd><a href=\"#\" class=\"command show-image\"> <%=i18n.image_button_label%></a></dd>\n        <dd class=\"action-node\"><a href=\"#\" class=\"command show-actions\"> <%=i18n.actions_button_label%></a></dd>\n      </dl>\n    </div>    \n  </div>    \n  <div class=\"row item-details\">\n    </div>        \n</div>";
    summaryActionTemplate = "<div class=\"row item-action-view\">\n  <div class=\"left-buttons hide-on-phones\">\n    <a href=\"\" class=\"green small button radius edit\"><%= i18n.edit_button_label%></a>\n  </div>\n  <div class=\"action-buttons right\">\n  </div>\n</div>";
    layoutConfig = {
      rows: [
        {
          fields: [
            {
              label: i18n.vendor_name,
              dataField: "VENDOR_NAME",
              css: "nine phone-two columns",
              readOnly: true
            }, {
              label: i18n.invoice_amount,
              dataField: "INV_AMT",
              css: "three phone-two columns right",
              type: "money",
              readOnly: true
            }
          ]
        }, {
          fields: [
            {
              label: i18n.vendor_number,
              dataField: "VENDOR_NBR",
              css: "three phone-two columns",
              readOnly: true
            }, {
              label: i18n.invoice_number,
              dataField: "INV_NBR",
              css: "four phone-two columns",
              readOnly: true
            }, {
              label: i18n.invoice_date,
              dataField: "INV_DATE",
              css: "three phone-two columns",
              type: "date",
              readOnly: true
            }
          ]
        }
      ]
    };
    glFieldConfig = {
      primaryFields: [
        {
          label: i18n.gl_account,
          dataField: "GL_ACCT_CODE",
          css: "two phone-one columns",
          type: "number"
        }, {
          label: i18n.gl_sub_account,
          dataField: "GL_SUB_ACCT",
          css: "two phone-one columns",
          type: "number"
        }, {
          label: i18n.gl_business_unit,
          dataField: "GL_BUS_UNIT",
          css: "two phone-one columns"
        }, {
          label: i18n.gl_description,
          dataField: "GL_DESC",
          css: "six phone-four columns"
        }, {
          label: i18n.gl_amount,
          dataField: "GL_AMT",
          css: "two phone-one columns",
          type: "money"
        }
      ],
      extendedFields: {
        fields: [
          {
            label: i18n.gl_charge_property,
            dataField: "CHRG_BUS_UNIT",
            css: "two phone-one columns"
          }, {
            label: i18n.gl_project_number,
            dataField: "GL_PROJECT_ID",
            css: "two phone-one columns"
          }, {
            label: i18n.gl_activity,
            dataField: "ACTIVITY",
            css: "four phone-two columns"
          }, {
            label: i18n.gl_cost_code,
            dataField: "COST_CODE",
            css: "two phone-one columns"
          }, {
            label: i18n.gl_job_code,
            dataField: "JOB_CODE",
            css: "two phone-one  columns"
          }, {
            label: i18n.gl_project_routing,
            dataField: "PROJ_ROUTING",
            css: "three phone-one  columns"
          }
        ]
      }
    };
    ICG.UI.InvoiceItemSummaryView = Backbone.View.extend({
      className: "invoice-item-summary-view",
      events: {
        "click a": "viewSelected"
      },
      initialize: function() {
        return this._initialize();
      },
      _initialize: function() {
        var self;
        self = this;
        this.template = _.template(viewTemplate);
        this.glView = new ICG.UI.GLView({
          collection: this.model.glLines,
          readOnly: true,
          fieldConfig: glFieldConfig
        });
        this.imageView = new ICG.UI.AttachmentView({
          collection: this.model.attachments
        });
        this.timelineView = new ICG.UI.TimelineView({
          collection: this.model.timeline
        });
        this.actionView = new ICG.UI.SummaryActionView(this.options);
        this.actionView.bind("actionClicked", this.itemAction, this);
        this.actionView.bind("editClicked", this.itemEdit, this);
        if (this.model) {
          this.model.invoice.bind("change", this.render, this);
          this.model.bind("stateChange", this.modelStateChange, this);
          this.model.bind("displayStateChange", this.displayStateChange, this);
        }
        $(this.el).data("view", this);
        if (App.socket) {
          return App.socket.on("user-action", function(data) {
            var warning;
            if (data.workID === self.model.get("WORK_ID")) {
              warning = void 0;
              switch (data.action.toLowerCase()) {
                case "approve":
                  warning = "Another user has just approved this item";
                  break;
                case "reject":
                  warning = "Another user has just rejected this item";
                  break;
                case "edit":
                  warning = "Another user is editing this item";
                  break;
                default:
                  warning = "Another user is actively reviewing this item";
              }
              console.log(warning);
              return self.showConflictWarning(warning);
            }
          });
        }
      },
      render: function() {
        return this._render();
      },
      _render: function() {
        var $this, renderedContent, self;
        renderedContent = this.template({
          i18n: i18n
        });
        self = this;
        $this = $(this.el);
        $this.html(renderedContent);
        _.each(layoutConfig.rows, function(rowConfig) {
          var row;
          row = $("<div class=\"row\"></div>");
          self.$(".header-area").append(row);
          return _.each(rowConfig.fields, function(fieldConfig) {
            var field;
            field = new ICG.UI.DataField(fieldConfig);
            $(field.render().el).addClass(fieldConfig.css);
            field.val(self.model.invoice.get(fieldConfig.dataField));
            return row.append(field.el);
          });
        });
        this.detailsView = new ICG.UI.CollapsingView();
        this.$(".item-details").html(this.detailsView.render().el);
        if (this.options.allowEditAction || this.options.userActions) {
          this.$(".action-node").show();
        } else {
          this.$(".action-node").hide();
        }
        return this;
      },
      viewSelected: function(event) {
        var $target, self, switchView;
        self = this;
        event.preventDefault();
        $target = $(event.currentTarget);
        switchView = function(view) {
          if (self.detailsView.state === "open") {
            return self.detailsView.collapse(function() {
              if (self.currentDetailsView !== view) {
                self.detailsView.html(view.el);
                self.detailsView.expand(function() {
                  self.currentDetailsView = view;
                  if (view.draw) return view.draw();
                });
                if (App.socket) {
                  return App.socket.emit("user-action", {
                    session: App.socket.socket.sessionid,
                    action: "review",
                    workID: self.model.get("WORK_ID")
                  });
                }
              } else {
                return self.currentDetailsView = null;
              }
            });
          } else {
            self.detailsView.html(view.el);
            return self.detailsView.expand(function() {
              self.currentDetailsView = view;
              if (view.draw) return view.draw();
            });
          }
        };
        if ($target.hasClass("show-gl")) {
          this.glView.render().collection.fetch();
          return switchView(this.glView);
        } else if ($target.hasClass("show-timeline")) {
          this.timelineView.render().collection.fetch();
          return switchView(this.timelineView);
        } else if ($target.hasClass("show-image")) {
          this.imageView.render();
          return switchView(this.imageView);
        } else if ($target.hasClass("show-actions")) {
          this.actionView.render();
          return switchView(this.actionView);
        }
      },
      itemAction: function(event) {
        var self, userAction;
        self = this;
        userAction = event.value;
        this.model.saveWithAction(userAction, this.model, null);
        if (App.socket) {
          return App.socket.emit("user-action", {
            session: App.socket.socket.sessionid,
            action: userAction,
            workID: self.model.get("WORK_ID")
          });
        }
      },
      itemEdit: function() {
        var self;
        self = this;
        if (App.router) {
          App.router.navigate("invoice/edit/" + this.model.get("WORK_ID"), true);
        }
        if (App.socket) {
          return App.socket.emit("user-action", {
            session: App.socket.socket.sessionid,
            action: "edit",
            workID: self.model.get("WORK_ID")
          });
        }
      },
      showConflictWarning: function(warning) {
        var warningDiv;
        warningDiv = "<div class=\"alert-box warning conflict\">" + warning + "</div>";
        $(".conflict", this.el).remove();
        return this.$(".item-view").prepend(warningDiv);
      },
      addStatusOverlay: function(message, close) {
        console.log("Adding Status Overlay", this);
        if (this.overlayView) this.overlayView.$el.remove();
        this.overlayView = new ICG.UI.OverlayView({
          message: message,
          closeButton: close
        });
        this.overlayView.bind("dismissOverlay", this.dismissItem, this);
        return this.$el.append(this.overlayView.render().el);
      },
      removeStatusOverlay: function() {
        if (this.overlayView) return this.overlayView.$el.remove();
      },
      addAlert: function(message, close, autoDismiss, cssClass) {
        var $alertView, alertView;
        alertView = new ICG.UI.AlertView({
          message: message,
          closeButton: close,
          autoDismiss: autoDismiss
        });
        this.$(".alert-area").append(alertView.render().el);
        $alertView = $(alertView.el);
        if (cssClass) {
          $alertView.addClass(cssClass);
        } else {
          $alertView.addClass("info");
        }
        $alertView.hide();
        return $alertView.slideDown();
      },
      removeAlerts: function() {
        var self;
        self = this;
        return this.$(".alert-box").slideUp(function() {
          return self.$(".alert-box").remove();
        });
      },
      dismissItem: function() {
        var self;
        self = this;
        return this.$el.fadeOut(function() {
          return self.$el.remove();
        });
      },
      displayStateChange: function() {
        if (this.model.displayState === "hidden") {
          return this.$el.slideUp(200);
        } else {
          return this.$el.slideDown(200);
        }
      },
      modelStateChange: function() {
        var message, userAction;
        message = void 0;
        userAction = this.model.get("USER_ACTION");
        switch (this.model.state) {
          case "saving":
            switch (userAction) {
              case "REJECT":
                message = i18n.rejecting_invoice;
                break;
              case "APPROVE":
                message = i18n.approving_invoice;
                break;
              default:
                message = i18n.saving_invoice;
            }
            return this.addStatusOverlay(message, {
              closeButton: true
            });
          case "saved":
            switch (userAction) {
              case "REJECT":
                message = i18n.rejected_invoice;
                break;
              case "APPROVE":
                message = i18n.approved_invoice;
                break;
              default:
                message = i18n.saved_invoice;
            }
            return this.addStatusOverlay(message, {
              closeButton: true
            });
          case "error":
            return this.addAlert("Error:  " + this.model.error, true, false, "error");
          case "hidden":
            return $(this.el).slideUp();
          default:
            return $(this.el).slideDown();
        }
      }
    });
    return ICG.UI.SummaryActionView = Backbone.View.extend({
      events: {
        "click a.edit": "editClicked",
        "click a.action": "actionClicked"
      },
      initialize: function() {
        return this.template = _.template(summaryActionTemplate);
      },
      render: function() {
        var $this, renderedContent, self;
        renderedContent = this.template({
          i18n: i18n
        });
        self = this;
        $this = $(this.el);
        $this.html(renderedContent);
        _.each(self.options.userActions, function(userAction) {
          var $button;
          $button = $("<a href=\"\" class=\"small button radius action\">" + userAction.label + "</a>");
          $button.addClass(userAction.value);
          $button.data("userAction", userAction);
          if (userAction.css) $button.addClass(userAction.css);
          return self.$(".action-buttons").append($button);
        });
        if (this.options.allowEditAction) {
          this.$(".edit").show();
        } else {
          this.$(".edit").hide();
        }
        return this;
      },
      editClicked: function(event) {
        event.preventDefault();
        return this.trigger("editClicked");
      },
      actionClicked: function(event) {
        event.preventDefault();
        return this.trigger("actionClicked", $(event.currentTarget).data("userAction"));
      }
    });
  });

}).call(this);
