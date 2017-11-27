// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient

var urlMongo = process.env.DBCONNSTR;
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

function isURL(str) {
     var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
     var url = new RegExp(urlRegex, 'i');
     return str.length < 2083 && url.test(str);
}

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/:id", function (request, response) {
  var id = parseInt(request.params.id,10);
  mongo.connect(urlMongo, function(err,db){
    if (err) throw err;
    
    var urls = db.collection("urls");
    urls.findOne({_id: id}, function(err, doc) {
      if (err) throw err;
      if (doc) {
        response.redirect(doc.original_url);
      }
      else {
        response.status(404);
        response.end(JSON.stringify({error: "'http://" + request.headers["x-forwarded-host"] + "/" + request.params.id + "' does not exists."}));
      }
      db.close();
    });
  });
});

app.get("/new/:url*", function (request, response) {
  var originalUrl = request.params.url + request.param(0);
  if (isURL(originalUrl)){
    mongo.connect(urlMongo, function(err,db){
      if (err) throw err;

      var urls = db.collection("urls");

      urls.findOne({original_url: originalUrl}, function(err, doc) {
        if (err) throw err
        console.log(doc);
        if (doc){
          var shortUrl = "http://" + request.headers["x-forwarded-host"] + "/" + doc._id;
          var obj;
          obj = {original_url: originalUrl, short_url: shortUrl};
          response.end(JSON.stringify(obj));
          db.close();
        } else {
            urls.count(function(err,count){
              if (count > 0){
                var id = count;
                var shortUrl = "http://" + request.headers["x-forwarded-host"] + "/" + id;
                var obj;

                urls.insert({_id: id, original_url: originalUrl}, function(err,result){
                  if (err) throw err;
                  obj = {original_url: originalUrl, short_url: shortUrl};
                  response.end(JSON.stringify(obj));
                  db.close();
                });
              }
            })
          }
      });
    });
  } else {
    var obj = {error: "'" + originalUrl + "' is not a valid URL"};
    response.end(JSON.stringify(obj));
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});