/**
 * Reponse Methods:
 * render() - render's a page/template
 * send() - raw text
 *
 *
 *
 *

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

/*
 * GET hello world.
 */

exports.helloworld = function(req, res){
  res.render('helloworld', { title: 'Express World!' });
};

/*
 * GET list of games.
 */

exports.games = function(req, res){
  res.render('games', { title: 'Games!' });
};