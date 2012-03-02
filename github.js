var GitHubApi = require("github").GitHubApi, 
    _ = require("underscore"), 
    jade = require("jade"), 
    fs = require('fs'), 
    yaml = require('js-yaml'), 
    github = new GitHubApi(true),
    program = require('commander'),
    https = require('https'),
    md = require("node-markdown").Markdown,
    repository,
    environment,
    docConfig,
    committedAfter,
    committedBefore;

github.authenticate('Trimeego', '3516f427ae6698daf609a58885162199');

program
  .version('0.0.1')
  .option('-r, --repo [repository]', 'The github repository to pull release docs for')
  .option('-e, --env [environemnt]', 'The environment for which the release docs are being pulled')
  .option('-f, --from [date]', 'Date to start capturing changes')
  .option('-t, --to [date]', 'Date to stop capturing changes')
  .parse(process.argv);


if(!program.from){
  console.log ("You must provide a date.  Use --help.")
  process.exit();
}
else {
  committedAfter = Date.parse(program.from);
  if(!committedAfter){
    console.log ("Invalid From Date");
    process.exit();    
  }
}

if(!program.to){
  committedBefore = new Date();
}
else {
  committedBefore = Date.parse(program.to);
  if(!committedBefore){
    console.log ("Invalid To Date");
    process.exit();    
  }
}

if(!program.repo){
  console.log ("You must provide a repository.  Use --help.")
  process.exit();
}
else {
  repository = program.repo;
}

if(!program.env){
  console.log ("You must provide an environment.  Use --help.")
  process.exit();
}
else {
  environment = program.env;
}

docConfig  = require(__dirname + '/' +  repository + '.yaml')[0], targetCommits = [];
var pullApplicationDocs = function(callback) {
  var allFiles = [], callCount = 0, https = require('https'), docText = '';
  console.log('');
  console.log('Pulling Application Release Documents (release.md)');
  _.each(docConfig.applications, function(app) {
    //go ahead and pull the environment variables formt he target environment into the env var
    app.env = _.find(app.environments, function(it) {
      return it.name.toLowerCase() === environment.toLowerCase();
    });

    callCount += 1;
    https.get({ host: 'raw.github.com', path: '/ICGGroup/Loves/master/' +  app.githubPath + '/release.md?login=Trimeego&token=3516f427ae6698daf609a58885162199'}, function(res) {
      res.on('data', function(d) {
        if(res.statusCode===200){
          if(d&&d.toString()!=='undefined'){
            docText += d.toString();  
          }
        }
      });

      res.on('end', function() {
        process.stdout.write('.');
        callCount -= 1;
        if(res.statusCode===200){
          app.releaseNotes = md(docText);
        }
        if(callCount===0){
          callback();
        }
      });

    }).on('error', function(e) {
      callCount -= 1;
      if(callCount===0){
        callback();
      }
    });  
  });
};


var buildDoc = function(){
  var releaseApps = _.filter(docConfig.applications, function(app) {return app.releaseNeeded});
  var releaseServers = [];
  _.each(releaseApps, function(app) {
    _.each(app.env.servers, function(appServer) {
      var server = _.find(releaseServers, function(it) {return it.name===appServer.name});
      if(!server){
        server = {name:appServer.name, applications:[]};
        releaseServers.push(server);
      }
      server.applications.push(app);
    });
  });

  var path = __dirname + '/templates/application.jade'
  , str = fs.readFileSync(path, 'utf8')
  , fn = jade.compile(str, { filename: path, pretty: true });
    fs.writeFile(__dirname + "/output/" + repository + ".html", fn({apps:releaseApps, servers:releaseServers, program:program}), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("\noutput saved to /output/" + repository + ".html");
    }
}); 
};

var getCommits = function(page, callback) {
  process.stdout.write('.');
  github.getCommitApi().getBranchCommits('ICGGroup', repository, 'master?page=' + page, function(err, commits) {
    if(!commits||commits.length===0){
      callback();
    }
    else{
      var r = true;
      commits.forEach(function(commit) {
        var commitDate = Date.parse(commit.committed_date);
        if(commitDate>committedAfter&&commitDate<committedBefore){
            targetCommits.push(commit);
        }
        else{
          //once we start getting to dates that are too far back, we can stop
          r = false
        }
      });
      if(r){
        getCommits(page+1, callback);      
      }
      else{
        callback();
      }
    }
  });  
};

console.log('Getting Commit List');
getCommits(1, function() {
  console.log('');
  console.log('Getting Commit Details');
  var allFiles = [];
  var callCount = 0;
  targetCommits.forEach(function(commit) {
    callCount += 1;
    github.getCommitApi().getCommit('ICGGroup', 'Loves', commit.id, function(err, commitDetails) {
      callCount -= 1;
      var added, modified;
      if(err) {
        console.log(err)
      }
      if(commitDetails){
        if(commitDetails.added){
          added = commitDetails.added; 
        }
        if(commitDetails.modified){
          modified = _.map(commitDetails.modified, function(it) {return it.filename});  
        }

        allFiles = _.union(allFiles, _.uniq(_.union(added, modified)));
        process.stdout.write('.');
        if(callCount==0){
          //So we have gotten all of the commits
          _.each(docConfig.applications, function(app) {
            var appPath = "release/apportal"
            app.releaseFiles = _.sortBy(_.filter(allFiles, function(file) {
              if(file){
                return (file.indexOf(app.githubPath)>-1&&file.toLowerCase().indexOf('.ds_store')==-1);
              }
              else { 
                return false;
              }
            }), function(file) {return file});
            app.releaseNeeded = app.releaseFiles.length>0;
          });

          //Now that we have captured the changes, pull the release docs
          pullApplicationDocs(function() {
            //finally we can build.
            buildDoc();  
          })
          
        }
      }
    });      
  });
})
