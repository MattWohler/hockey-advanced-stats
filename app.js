/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var async = require('async');
var cheerio = require("cheerio");

// Hook Mongo
var mongo = require('mongodb'); // talk to MongoDB
var monk = require('monk'); // use Monk to do that

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router); // all of our custom routes
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
	var db = monk('localhost:27017/stats_dev'); // location of our db (27017 : Default Port | stats_dev : db name)
}
 
// Route Listeners (telling the app which routes to use when a particular URI is hit)2
app.get('/', routes.index);
app.get('/users/list', user.userlist(db)); 
app.get('/users/new', user.newuser);
app.post('/users/add', user.adduser(db));

// createServer with the express() via our http module.
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

// Configuration Objects
var settings = {
	url: 'http://www.nhl.com/ice/scores.htm?date=',
	games: {
		pre: [],
    during: [],
		post: []
	}
}

var scrapes = {
	init: []
}

/*
 * Route Parameter Preconditioning
 * Below is essentially like processing a potential paramater that is used multiple times outside just 1 route.
 * ie. We always look to return the paramater "id", with a user object queried from the db.
 * Makes it more OOP friendly.
 *
 * Next() - passes it down to the next layer of middleware.
 * app.param has precedence over app.get
 * w/o calling next(), it would stop here and not be passed to the layers below it.
 */ 

app.param('month', function(req, res, next, month) {
    req.month = month;
    next();
});
app.param('day', function(req, res, next, day) {
    req.day = day;
    next();
});
app.param('year', function(req, res, next, year) {
    req.year = year;
    next();
});

// Description 	: 	http://localhost:3000/games/date/12/13/2013
// Request     	:  	Month, Day, Year
// Response 	:  	Stream of the URL given
app.get('/games/date/:month/:day/:year', function(req, res) {
    var game_date_url = settings.url + req.month + '/' + req.day + '/' + req.year;
    
    // Description	: 	ajax get call on the URL, input is a stream.
    // Response		: 	A Stream of the URL data.
    http.get(game_date_url, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            // Now lets rock n roll!
            getGameDayStatus(data);
            
        });
    }).on("error", function() {
        callback(null);
    });
}); 




// BEGIN RUNNING MULTIPLE TASKS THAT DEPEND ON EACH OTHER
//
/*
 * Description: Runs through a series of anonymous functions to parse through the data
 *              Read the header of the anon for more info.
 * Type: Async.js 
 */
function getGameDayStatus(data) {

    async.series([
    
        // Loads the website content into a 'DOM' via cheerio.
        // And stores what we're looking for (jQuery style), into our scrapes array.
        function(callback) {
            if (data) {
                var $ = cheerio.load(data);
                
                $("div.sbGame").each(function(i, e) {
                    // var table = $(e).children('table');
                    var th = $(e).find('th').text();
                    scrapes.init.push(th);
                });

                callback(); // activates callback..move onto next anon!
            }
        },

        // Parses through each game (element) and sort by game status
        function(callback) {

            // each(array of data, function (array's Element, function to invoke reponse))
            async.each(scrapes.init, function (game, callback) {

                var ifPregame = game.substring(6,7);
                var ifPostgame = game.substring(0,5);
                
                /*
                 * == Possible Outcomes of our `Cheerio` scrapes ==
                 * 1) '7:00 PM ET1st2nd3rdT', (Pre-Game)
                 * 2) 'FINAL1st2nd3rdT', (Post-Game)
                 * 3) '05:02 2nd1st2nd3rdT' (During-Game)
                 */
                // Pre Games
                if (ifPregame == 'P' || ifPregame == 'M')
                    settings.games.pre.push(game);
                
                // POST Game
                else if(ifPostgame == "FINAL")
                    settings.games.post.push(game);
                
                // DURING Game
                else settings.games.during.push(game);

            });

            callback();
        }
    ], function(err) {
      // Log current status of games
      console.log('PreGames: ' + settings.games.pre.length);
      console.log('DuringGames: ' + settings.games.during.length);
      console.log('PostGames: ' + settings.games.post.length);
  });

}