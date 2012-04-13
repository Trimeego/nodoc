(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "app/icg/utils"], function(namespace, underscore, backbone) {
    var dataFieldTemplate, internalValue;
    dataFieldTemplate = "<label class='field-label'></label>\n<div class='field-value' />";
    internalValue = null;
    return ICG.UI.DataField = (function(_super) {

      __extends(DataField, _super);

      function DataField() {
        this.validate = __bind(this.validate, this);
        DataField.__super__.constructor.apply(this, arguments);
      }

      DataField.prototype.className = "form-field";

      DataField.prototype.tagName = "div";

      DataField.prototype.events = {
        "change input": "validate",
        "keyup input": "change",
        "keydown input": "validateKeyStroke",
        "blur input": "focusOut",
        "click input.radio-button": "selected",
        "change select": "selected"
      };

      DataField.prototype.initialize = function() {
        this.template = _.template(dataFieldTemplate);
        if (this.options && this.options.validator) {
          return this.customValidator = this.options.validator;
        }
      };

      DataField.prototype.validate = function(_val) {
        var valid;
        valid = true;
        if (!_val) _val = this.$(".field-value-element").val();
        if (this.customValidator) {
          valid = this.customValidator(this);
        } else {
          try {
            if (this.options.type === "number" && _val.length > 0) {
              valid = !isNaN(1 * _val);
            }
            if (!this.options.readOnly && this.options.required) {
              if (this.$(".field-value-element").attr("type") === "number" || this.$(".field-value-element").attr("type") === "money") {
                if (_val === 0) valid = false;
              } else {
                if (_val.length === 0) valid = false;
              }
            }
          } catch (e) {
            valid = false;
          }
        }
        if (valid) {
          $(this.el).removeClass("error");
        } else {
          $(this.el).addClass("error");
        }
        return valid;
      };

      DataField.prototype.reset = function() {
        this.options.value = this.options.originalValue;
        return this.render();
      };

      DataField.prototype.focusOut = function(event) {
        if (this.validate(this.$(".field-value-element").val())) {
          this.options.value = this.$(".field-value-element").val();
          return this.trigger("validChange", this);
        }
      };

      DataField.prototype.validateKeyStroke = function(event) {
        var isValid;
        isValid = true;
        if (event.keyCode !== 8 && event.keyCode !== 9) {
          switch (this.$(".field-value-element").attr("type")) {
            case "date":
            case "money":
            case "number":
              if ((event.keyCode < 96 || event.keyCode > 105) && (event.keyCode < 96 - 48 || event.keyCode > 105 - 48) && (event.keyCode !== 110 && event.keyCode !== 190)) {
                isValid = false;
              }
              if (this.$(".field-value-element").attr("type") === "date") {
                if (event.keyCode === 191 || event.keyCode === 111) isValid = true;
              } else {
                if ((event.keyCode === 110 || event.keyCode === 190) && event.currentTarget.value.indexOf(".") > -1) {
                  isValid = false;
                }
              }
          }
          if (event.keyCode === 37 || event.keyCode === 39) isValid = true;
        }
        return isValid;
      };

      DataField.prototype.formattedValue = function() {
        var _prettyVal;
        _prettyVal = null;
        switch (this.options.type) {
          case "date":
            _prettyVal = ICG.Utils.Date.dateFormat(this.options.value, "mm/dd/yyyy");
            break;
          case "money":
            _prettyVal = ICG.Utils.Number.formatMoney(this.options.value);
            break;
          case "number":
            _prettyVal = ICG.Utils.Number.formatNumber(this.options.value);
            break;
          default:
            _prettyVal = this.options.value;
        }
        return _prettyVal;
      };

      DataField.prototype.change = function(event) {
        this.validate(this.$(".field-value-element").val());
        return this.trigger("change");
      };

      DataField.prototype.selected = function(event) {
        this.val(event.srcElement.value);
        this.trigger("validChange", this);
        return this.trigger("change", this);
      };

      DataField.prototype.val = function(value) {
        var _val;
        if (value != null) {
          this.options.value = value;
          if (!this.options.readOnly) {
            switch (this.options.type) {
              case "radio":
              case "checkbox":
                this.$(".field-value-element").val(this.val());
                break;
              default:
                this.$(".field-value-element").val(this.formattedValue());
            }
            this.validate(this.$(".field-value-element").val());
          } else {
            this.$(".field-value-element").html(this.formattedValue());
          }
        } else {
          _val = "";
          if (this.options.readOnly) {
            _val = this.$(".field-value-element").html();
          } else {
            switch (this.options.type) {
              case "radio":
                _val = this.$(".checked").value;
                break;
              case "checkbox":
                _val = [];
                this.$("[type=checkbox]:checked").each(function(index) {
                  return _val.push($(this).val());
                });
                break;
              case "date":
                try {
                  _val = Date.parse(this.$(".field-value-element").val());
                } catch (e) {
                  _val = this.$(".field-value-element").val();
                  _val = "";
                }
                break;
              case "number":
              case "money":
                _val = new Number(this.$(".field-value-element").val().replace("$", "").split(",").join(""));
                break;
              default:
                return this.$(".field-value-element").val();
            }
          }
        }
        return this.validate();
      };

      DataField.prototype.set = function(value) {
        return this.val(value);
      };

      DataField.prototype.value = function() {
        return this.val();
      };

      DataField.prototype.render = function() {
        var $elDef, $label, $opt, $rb, $this, idx, radioName, renderedContent, self, v;
        renderedContent = this.template(this.options);
        $this = $(this.el);
        self = this;
        $this.html(renderedContent);
        $elDef = void 0;
        if (this.options.readOnly) {
          $elDef = $("<div />");
          if (!self.options.list) {
            $elDef.append(this.formattedValue());
          } else {
            idx = 0;
            while (idx < self.options.list.length) {
              if (self.options.list[idx].value === self.options.value) {
                $elDef.append(this.options.list[idx].label);
              }
              idx++;
            }
          }
          $elDef.addClass("read-only");
        } else if (this.options.list) {
          if (this.options.type === "radio" || this.options.type === "checkbox") {
            $elDef = $("<ol class=\"radio-list\" type=\"" + this.options.type + "\"  />");
          } else {
            $elDef = $("<select />");
          }
          idx = 0;
          radioName = ICG.Utils.guid();
          while (idx < this.options.list.length) {
            if (this.options.type === "radio" || this.options.type === "checkbox") {
              if (!self.options.dataField) throw "dataField attribute required.";
              $opt = $("<li></li>");
              $label = $("<label></label>");
              $rb = $("<input class=\"" + this.options.type + "-button\" type=\"" + this.options.type + "\" />");
              $label.append($rb);
              $rb.attr("value", self.options.list[idx].value);
              $label.append(this.options.list[idx].label);
              if (self.options.value && self.options.value !== "") {
                if (self.options.type === "checkbox") {
                  for (v in this.options.value) {
                    if (this.options.value[v] === self.options.list[idx].value) {
                      $rb.attr("checked", "true");
                    }
                  }
                } else if (self.options.type === "radio") {
                  if (self.options.value === self.options.list[idx].value) {
                    $rb.attr("checked", "true");
                    $rb.addClass("checked");
                  }
                }
              }
              if (self.options.dataField && self.options.dataField !== "") {
                $rb.attr("name", self.options.dataField);
              }
              $opt.append($label);
            } else {
              $opt = $("<option>");
              $opt.attr("value", self.options.list[idx].value);
              $opt.append(this.options.list[idx].label);
            }
            $elDef.append($opt);
            idx++;
          }
        } else if (this.options.type === "textarea") {
          $elDef = $("<textarea />");
          if (this.options.rows) $elDef.attr("rows", this.options.rows);
          if (this.options.cols) $elDef.attr("cols", this.options.cols);
        } else if (this.options.type === "textarea") {
          $elDef = $("<input type=\"password\" />");
          if (this.options.maxLength) {
            $elDef.attr("maxlength", this.options.maxLength);
          }
        } else {
          $elDef = $("<input />");
          if (this.options.maxLength) {
            $elDef.attr("maxlength", this.options.maxLength);
          }
        }
        if (this.options.label) this.$("label").append(this.options.label);
        if (!(this.options.readOnly != null) || this.options.readOnly === false) {
          if (!this.options.type || this.options.type === "text") {
            $elDef.attr("type", "text");
          } else if (this.options.type && this.options.type === "date") {
            $elDef.attr("placeholder", "MM/DD/YYYY");
            $elDef.attr("type", "date");
          } else if (!this.options.type || this.options.type === "number") {
            $elDef.attr("type", "number");
          } else {
            if (!this.options.type || this.options.type === "money") {
              $elDef.attr("type", "money");
            }
          }
          if (this.options.value && self.options.type !== "checkbox") {
            $elDef.attr("value", self.formattedValue());
          }
        }
        if (this.options.required && this.options.required === true) {
          this.$(".field-label").addClass("required");
          $elDef.addClass("required");
        }
        if (this.options.value && !this.options.originalValue) {
          this.options.originalValue = this.options.value;
        }
        if (this.options.css) $this.addClass(this.options.css);
        if (this.options.dataField) $this.addClass(this.options.dataField);
        $elDef.addClass("field-value-element");
        this.$(".field-value").append($elDef);
        $this.data("dataField", this);
        return this;
      };

      return DataField;

    })(Backbone.View);
  });

}).call(this);
