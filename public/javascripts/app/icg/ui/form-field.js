(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(["order!app/icg/namespace", "order!vendor/underscore", "order!vendor/backbone", "app/icg/utils"], function(namespace, underscore, backbone) {
    var dataFieldTemplate;
    dataFieldTemplate = "<label class='field-label'></label><div class='field-value' />";
    return ICG.UI.FormField = (function(_super) {

      __extends(FormField, _super);

      function FormField() {
        this.render = __bind(this.render, this);
        this.focusOut = __bind(this.focusOut, this);
        this.getText = __bind(this.getText, this);
        this.change = __bind(this.change, this);
        FormField.__super__.constructor.apply(this, arguments);
      }

      FormField.prototype.className = "form-field";

      FormField.prototype.tagName = "div";

      FormField.prototype.events = {
        "change input": "validate",
        "keyup input": "change",
        "keydown input": "validateKeyStroke",
        "blur input": "focusOut",
        "click input.radio-button": "selected",
        "change select": "selected"
      };

      FormField.prototype.initialize = function() {
        var _base;
        this.template = _.template(dataFieldTemplate);
        if (this.options && this.options.validator) {
          this.customValidator = this.options.validator;
        }
        if (this.options && this.options.value) {
          this.internalValue = this.options.value;
        }
        if ((_base = this.options).type == null) _base.type = 'text';
        switch (this.options.type) {
          case 'date':
            if (this.options && this.options.value) {
              this.internalValue = this.options.value;
            }
            break;
          case 'number':
            if (this.options && this.options.value) {
              this.internalValue = new Number(this.options.value);
            }
        }
        return this.originalValue = this.internalValue;
      };

      FormField.prototype.change = function(event) {
        if (this.options && this.options.validateOnKeyStroke === true) {
          if (this.validate(null)) this.trigger("validChange", this);
        }
        return this.trigger("change");
      };

      FormField.prototype.getText = function() {
        return this.$(".field-value-element").val();
      };

      FormField.prototype.focusOut = function(event) {
        this.internalValue = this.$(".field-value-element").val();
        if (this.validate(this.$(".field-value-element").val())) {
          this.internalValue = this.$(".field-value-element").val();
          this.options.value = this.internalValue;
          return this.trigger("validChange", this);
        }
      };

      FormField.prototype.formattedValue = function() {
        var formatted;
        formatted = this.internalValue;
        switch (this.options.type) {
          case 'date':
            formatted = ICG.Utils.Date.dateFormat(this.internalValue, "mm/dd/yyyy");
            break;
          case 'number':
            formatted = ICG.Utils.Number.formatNumber(this.internalValue - 0);
            break;
          case 'money':
            formatted = ICG.Utils.Number.formatMoney(this.internalValue);
        }
        return formatted;
      };

      FormField.prototype.render = function() {
        var $obj, $opt, $this, idx, renderedContent, _base, _ref;
        renderedContent = this.template(this.options);
        $this = $(this.el);
        $this.html(renderedContent);
        if (this.options.css) this.$el.addClass(this.options.css);
        if (this.options.type) this.$el.addClass(this.options.type);
        if (this.options.dataField) this.$el.addClass(this.options.dataField);
        if (this.options.label) this.$("label").append(this.options.label);
        if (!this.options.readOnly) {
          if (this.options.list) {
            $obj = $("<select />");
            idx = 0;
            while (idx < this.options.list.length) {
              $opt = $("<option>");
              $opt.attr("value", this.options.list[idx].value);
              if (this.options.value && this.options.value === this.options.list[idx].value) {
                $opt.attr("selected", "true");
              }
              $opt.append(this.options.list[idx].label);
              $obj.append($opt);
              idx++;
            }
          } else {
            $obj = $("<input />");
            $obj.attr('type', (_ref = (_base = this.options).type) != null ? _ref : _base.type = 'text');
            if (this.options.type === 'date') {
              $obj.attr("placeholder", "MM/DD/YYYY");
            }
            if (this.internalValue !== null) {
              $obj.attr('value', this.formattedValue());
            }
          }
        } else {
          $obj = $("<div />");
          $obj.append(this.formattedValue());
        }
        if (this.options.type === "date") {
          $obj.attr('maxlength', '10');
        } else {
          if (this.options.maxLength) {
            $obj.attr("maxlength", this.options.maxLength);
          }
        }
        $obj.addClass("field-value-element");
        this.$(".field-value").append($obj);
        return this;
      };

      FormField.prototype.reset = function() {
        return this.val(this.originalValue);
      };

      FormField.prototype.selected = function(event) {};

      FormField.prototype.set = function(value) {
        return this.val(value);
      };

      FormField.prototype.val = function(value) {
        var iv;
        if (value !== void 0) this.internalValue = value;
        if (value !== void 0) {
          this.internalValue = value;
          this.render();
        } else {
          iv = this.internalValue;
          if (this.options.list && this.options.list.length > 0) {
            iv = this.$('.field-value-element').val();
            this.internalValue = iv;
          }
          switch (this.options.type) {
            case 'date':
              iv = new Date(Date.parse(this.internalValue));
              break;
            case 'number':
            case 'money':
              iv = new Number(this.internalValue.replace("$", "").replace(",", ""));
          }
        }
        return iv;
      };

      FormField.prototype.value = function(value) {
        return this.val(value);
      };

      FormField.prototype.validate = function(event) {
        var isValid;
        isValid = true;
        $(this.el).removeClass("error");
        if (this.getText() !== '') {
          switch (this.options.type) {
            case 'date':
              isValid = ICG.Utils.Date.isDate(this.getText());
          }
          if (isValid !== true) $(this.el).addClass("error");
        }
        if (isValid === true && !this.options.readOnly && this.options.required && this.getText() === '') {
          $(this.el).removeClass("error");
        }
        return isValid;
      };

      FormField.prototype.validateKeyStroke = function(event) {
        var isValid, kc;
        isValid = true;
        kc = event.keyCode;
        if (kc !== 8 && kc !== 9 && kc !== 37 && kc !== 39) {
          if (this.options.type === "money" || this.options.type === "number") {
            isValid = (event.keyCode === 110 || event.keyCode === 190) || (event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 48 + 48 && event.keyCode <= 57 + 48);
          }
          if (this.options.type === "date") {
            isValid = event.keyCode === 191 || (event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 48 + 48 && event.keyCode <= 57 + 48);
          }
        }
        return isValid;
      };

      return FormField;

    })(Backbone.View);
  });

}).call(this);
