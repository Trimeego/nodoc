var GitHubApi = require("github").GitHubApi, 
    _ = require("underscore"), 
    jade = require("jade"), 
    fs = require('fs'), 
    yaml = require('js-yaml'), 
    github = new GitHubApi(true),
    program = require('commander'),
    https = require('https'),
    md = require("node-markdown").Markdown,
    PDFDocument = require('pdfkit'),
    dateFormat = require('node-dateformat'),
    repository,
    environment,
    docConfig,
    committedAfter,
    committedBefore;


program
  .version('0.0.1')
  .option('-r, --repo [repository]', 'The github repository to pull release docs for')
  .option('-e, --env [environemnt]', 'The environment for which the release docs are being pulled')
  .option('-f, --from [date]', 'Date to start capturing changes')
  .option('-t, --to [date]', 'Date to stop capturing changes')
  .option('-n, --title [title] ', 'The title of the release.')
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

var queuedCommits = [];
var allFiles = [];
var callCount = 0;


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
    https.get({ host: 'raw.github.com', path: '/ICGGroup/Loves/master/' +  app.githubPath + '/release.md?login=Trimeego&token=31e3e2e09d42e5362e143f9a3b64144e'}, function(res) {
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
          app.rawReleaseNotes = docText;
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


  //build the PDF Document
  doc = new PDFDocument();

  doc.info['Title'] = 'Release Document';
  doc.info['Author'] = 'ICG Consulting';


  //Title Page
  doc.font('Times-Roman')

  doc.image('images/icg.png', 72, 53, {fit: [150, 67]})
  doc.image('images/' + repository + '.png', 380, 72,  {fit: [150, 67]})

  doc.fontSize(25).text(program.title, 106, 300, {width:400, align:'center'});

  doc.fontSize(9).text('Repository:   ' + repository, 450, 650);
  doc.fontSize(9).text('Environment:  ' + environment);
  doc.fontSize(9).text('From Date:  ' + program.from);
  if(program.to) {
    doc.fontSize(9).text('To Date:  ' + program.to);  
  }
  doc.fontSize(9).text('Run Date:  ' + dateFormat(new Date(), "yyyy-mm-dd"));  
  


  //summary
  doc.addPage();
  doc.fontSize(18).fillColor('#274567').text('Release Summary');
  doc.moveDown();

  _.each(releaseServers, function(server){
    doc.fontSize(14).fillColor('#000000').text('Server: ' + server.name);
    doc.moveDown();

    var lineY = doc.y
    doc.fontSize(10).fillColor('#274567').text('Application', 80, lineY, {width:170});
    doc.fontSize(10).fillColor('#274567').text('Release Path', 255, lineY, {width:250});

    _.each(server.applications, function(app){
      lineY = doc.y
      doc.fontSize(10).fillColor('#000000').text(app.name, 80, lineY, {width:170});
      doc.fontSize(10).fillColor('#000000').text(app.localSourcePath, 255, lineY, {width:250});
    });
  });

  doc.moveDown(2);  

  //Applications
  _.each(releaseApps, function(app) {
    doc.addPage();

    doc.fontSize(18).fillColor('#274567').text(app.name, 72, doc.y).moveDown(0.5);

    doc.fontSize(12).fillColor('#000000').text(app.description, 72, doc.y);

    doc.moveDown(2);

    if(app.deploymentInstructions){    
      doc.fontSize(14).fillColor('#4f81bd').text('Deployment Instructions', 80).moveDown(0.5);
      _.each(app.deploymentInstructions, function(item) {
        doc.circle(85, doc.y+3.5, 1.5).fillColor('#4f81bd');
        doc.fillAndStroke();
        doc.fontSize(10).fillColor('#000000').text(item.text, 95, doc.y);
      });

      doc.moveDown();
    }

    if(app.env&&app.env.database){    
      doc.fontSize(14).fillColor('#4f81bd').text('Database Information', 80, doc.y).moveDown(0.5);

      lineY = doc.y
      doc.fontSize(10).fillColor('#000000').text('Server', 80, lineY, {width:170});
      doc.fontSize(10).fillColor('#000000').text(app.env.database.server, 155, lineY, {width:200});

      lineY = doc.y
      doc.fontSize(10).fillColor('#000000').text('Database', 80, lineY, {width:170});
      doc.fontSize(10).fillColor('#000000').text(app.env.database.dbName, 155, lineY, {width:200});

      lineY = doc.y
      doc.fontSize(10).fillColor('#000000').text('Scripts', 80, lineY, {width:170});
      doc.fontSize(10).fillColor('#000000').text(app.releaseFiles.length, 155, lineY, {width:200});

      doc.moveDown();
    }
    else {
      doc.fontSize(14).fillColor('#4f81bd').text('Deployment Target(s)', 80).moveDown(0.5);

      _.each(app.env.servers, function(server) {
        lineY = doc.y
        doc.fontSize(10).fillColor('#000000').text(server.name, 80, lineY, {width:170});
        doc.fontSize(10).fillColor('#000000').text(server.appPath, 155, lineY, {width:200});      
      });

      doc.moveDown();
    }

    if(app.listFiles){

      doc.fontSize(14).fillColor('#4f81bd').text('Files', 80, doc.y);
      _.each(app.releaseFiles, function(file) {
        lineY = doc.y
        doc.fontSize(9).fillColor('#000000').text(file.filename);
      });

    }


  });


  doc.write('output/' + repository + '.pdf');


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

var getCommitDetails = function(commit){
  callCount += 1;
  github.getCommitApi().getCommit('ICGGroup', 'Loves', commit.id, function(err, commitDetails) {
    callCount -= 1;
    var added, modified;
    if(err) {
      console.log(err)
    }
    if(commitDetails){
      var addedAndModified = [];

      if(commitDetails.added){
        addedAndModified = _.union(addedAndModified, commitDetails.added); 
      }
      if(commitDetails.modified){
        addedAndModified = _.union(addedAndModified, _.map(commitDetails.modified, function(it) {return it.filename})); 
      }

      if(commitDetails.removed){
        var removedObj = [];
        _.each(commitDetails.removed, function(file) {
          var fileObject = _.find(allFiles, function(item) {return item.filename===file});
          if(fileObject) {
            removedObj.push(fileObject);
          }
        });
        allFiles = _.without(allFiles, removedObj);
      }

      addedAndModified = _.uniq(addedAndModified);

      _.each(addedAndModified, function(file) {
        //console.log(file);
        var currentCommitDate = Date.parse(commitDetails.committed_date);
        var fileObject = _.find(allFiles, function(item) {return item.filename===file});
        if(fileObject) {
          var fileCommitDate = Date.parse(fileObject.lastCommit.committed_date);
          if(currentCommitDate>fileCommitDate){
            fileObject.lastCommit = commitDetails;
            fileObject.lastCommitDate = currentCommitDate;
          }

        }
        else {
          allFiles.push({filename:file, lastCommit:commitDetails, lastCommitDate:currentCommitDate});
        }
      });
    }
    process.stdout.write('.');
    if(callCount<10&&queuedCommits.length>0){
      getCommitDetails(queuedCommits.pop());      
    }
    if(callCount==0&&queuedCommits.length===0){
      //So we have gotten all of the commits
      _.each(docConfig.applications, function(app) {
        var appPath = "release/apportal"
        app.releaseFiles = _.filter(allFiles, function(releaseFileCandidate) {
          //console.log(releaseFileCandidate);
          if(releaseFileCandidate){
            return (releaseFileCandidate.filename.indexOf(app.githubPath)>-1&&releaseFileCandidate.filename.toLowerCase().indexOf('.ds_store')==-1);
          }
          else { 
            return false;
          }
        });
  
        app.releaseFiles = _.sortBy(app.releaseFiles, function(file) {
          return file.lastCommitDate;
        });

        app.releaseNeeded = app.releaseFiles.length>0;
      });

      //Now that we have captured the changes, pull the release docs
      pullApplicationDocs(function() {
        //finally we can build.
        buildDoc();  
      })
      
    }
  });    
}


console.log('Getting Commit List');
getCommits(1, function() {
  console.log('');
  console.log('Getting Commit Details');
  targetCommits.forEach(function(commit) {
    if(callCount>10){
      queuedCommits.push(commit);
    }
    else{
      getCommitDetails(commit); 
    }
  
  });
});


