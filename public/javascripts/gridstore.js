(function() {

  require(["order!jquery", "order!vendor/underscore", "order!vendor/backbone", "order!app/icg/ui/uploader"], function() {
    var uploader;
    uploader = new ICG.UI.Uploader({
      uploadURL: "/api/gridstore"
    });
    $('body').append(uploader.render().el);
    return uploader.bind("fileUploadComplete", function(file) {
      return console.log(file);
    });
  });

}).call(this);
