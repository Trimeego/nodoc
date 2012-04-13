(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  require(["order!jquery", "order!vendor/underscore", "order!vendor/backbone", "order!app/icg/ui/uploader"], function() {
    var uploader;
    if (typeof Loves === "undefined" || Loves === null) Loves = {};
    Loves.Statement = (function(_super) {

      __extends(Statement, _super);

      function Statement() {
        Statement.__super__.constructor.apply(this, arguments);
      }

      Statement.prototype.idAttribute = "_id";

      Statement.prototype.url = function() {
        if (this.id) {
          return "/api/statements/" + this.id;
        } else {
          return "/api/statements";
        }
      };

      return Statement;

    })(Backbone.Model);
    Loves.Statements = (function(_super) {

      __extends(Statements, _super);

      function Statements() {
        Statements.__super__.constructor.apply(this, arguments);
      }

      Statements.prototype.model = Loves.Statement;

      Statements.prototype.url = "/api/statements";

      return Statements;

    })(Backbone.Collection);
    Loves.EmployeeStatement = (function(_super) {

      __extends(EmployeeStatement, _super);

      function EmployeeStatement() {
        EmployeeStatement.__super__.constructor.apply(this, arguments);
      }

      EmployeeStatement.prototype.idAttribute = "_id";

      EmployeeStatement.prototype.url = function() {
        if (this.id) {
          return "/api/employee_statements/" + this.id;
        } else {
          return "/api/employee_statements";
        }
      };

      return EmployeeStatement;

    })(Backbone.Model);
    Loves.EmployeeStatements = (function(_super) {

      __extends(EmployeeStatements, _super);

      function EmployeeStatements() {
        EmployeeStatements.__super__.constructor.apply(this, arguments);
      }

      EmployeeStatements.prototype.model = Loves.Statement;

      EmployeeStatements.prototype.url = "/api/employee_statements";

      return EmployeeStatements;

    })(Backbone.Collection);
    uploader = new ICG.UI.Uploader({
      url: "/api/parsexlsx"
    });
    $('body').append(uploader.render().el);
    $('body').append('<pre><pre>')
    return uploader.bind("fileUploadComplete", function(file) {
      $('pre').html(JSON.stringify(file));
    });
  });

}).call(this);
