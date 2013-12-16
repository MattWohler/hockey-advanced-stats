/*
 * GET users - listing.
 * Passing our db var & render.
 * Specifiying which collection we want to use, 'usercollection' and do a find
 * return : the results as the variable, "docs".
 */

exports.userlist = function(db) {
    return function(req, res) {
        var collection = db.get('usercollection');
        collection.find({},{},function(e,docs){
            res.render('userlist', { "userlist" : docs });
        });
    };
};

/*
 * GET DB Input page
 */
exports.newuser = function(req, res){
  res.render('newuser', { title: 'Add New User' });
};

/*
 * POST form
 */
exports.adduser = function(db) {
        return function(req, res) {

                // Get our form values. These rely on the "name" attributes
                var userName = req.body.username;
                var userEmail = req.body.useremail;

                // Set our collection
                var collection = db.get('usercollection');

                // Submit to the DB
                collection.insert({
                        "username" : userName,
                        "email" : userEmail
                }, function (err, doc) {
                        if (err) {
                                // If it failed, return error
                                res.send("There was a problem adding the information to the database.");
                        }
                        else {
                                // If it worked, set the header so the address bar doesn't still say /adduser
                                res.location("users/list");
                                // And forward to success page 
                                res.redirect("users/list");
                        }
                });

        }
}