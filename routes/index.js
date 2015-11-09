var express = require('express');
var router = express.Router();
var Account = require('../models/account');
var async = require('async');
var title = 'Voxbone Demo v0.2';
var crypto = require('crypto');
var nodemailer = require('nodemailer');

module.exports = function(passport){

  router.get('/login', function(req, res, next){
    res.render('login', { title: title, email: req.query.email, account: accountLoggedIn(req), message: req.flash('loginMessage') });
  });

  router.post('/login',
    passport.authenticate('local-login'),//returns 401 unauthorized if not logged in
    function(req, res, next){
      var formData = req.body;
      var result = { message: "", errors: null, redirect: '/widget', email: formData.email }
      res.status(200).json(result);
  });

  router.get('/signup', function(req, res, next){
    if(req.query.email){
      Account.findOne({ email: req.query.email }, function(err, the_account){
        if(the_account){
          if(the_account.temporary == true){
            res.render('signup', { title: title, email: req.query.email, account: accountLoggedIn(req) });
          }else {
            if (accountLoggedIn(req)){
              res.render('/widget', {title: title, account: accountLoggedIn(req) });
            }else{
              res.render('login', { title: title, email: req.query.email, account: accountLoggedIn(req) });
            }
          }
        }else{
          var an_account = new Account({
            email: req.query.email,
            voxbone_password: req.query.password,
            temporary: true
          });

          an_account.save(function(err) {
            if (err) throw err;
            res.render('signup', { title: title, email: req.query.email, account: accountLoggedIn(req) });
          });
        }
      });
    } else{
      res.render('login', { title: title, account: accountLoggedIn(req) });
    }
  });

  //POST /signup fetch the account with that email, set the new password and temporary to false.
  router.post('/signup', function(req, res, next){
    var formData = req.body;
    var result = { message: "", errors: null, redirect: '/widget', email: formData.email }
    //TODO validate fields
    //email regex
    //same password and confirmation
    Account.findOne({ email: formData.email }, function(err, the_account){
      the_account.password = the_account.generateHash(formData.password);
      the_account.temporary = false;
      the_account.save(function(err){
        if(err) throw err;
        req.logIn(the_account, function(err) {
          res.status(200).json(result);
        });
      });
    });

  });

  router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  router.get('/widget', isLoggedIn, function(req, res, next) {
    res.render('widget', { title: title, account: accountLoggedIn(req) });
  });

  router.get('/', function(req, res, next) {
    res.render('login', { title: title, account: accountLoggedIn(req) });
  });

  router.get('/forgot', function(req, res, next){
    res.render('forgot', { title: title, email: req.query.email, account: accountLoggedIn(req) });
  });

  router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        Account.findOne({ email: req.body.email }, function(err, account) {
          if (!account) {
            var result = { message: "No account with that email address exists.", errors: err }
            return res.status(400).json(result);
          }

          account.resetPasswordToken = token;
          account.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          account.save(function(err) {
            done(err, token, account);
          });
        });
      },
      function(token, account, done) {
        var smtpTransport = nodemailer.createTransport('SMTP', {
          service: 'SendGrid',
          auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD
          }
        });
        var mailOptions = {
          to: account.email,
          from: process.env.FROM,
          subject: 'Voxbone Widget Generator - Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n',
          html: "<h2> Password Reset </h2> <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.<br/> Please click on the following link, or paste this into your browser to complete the process: <br/> http://"+ req.headers.host + "/reset/" + token +"<br/> If you did not request this, please ignore this email and your password will remain unchanged. </p>"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          if(err){
            done(err, 'done');
          }else{
            var result = { message: "An e-mail has been sent to " + account.email + " with further instructions.", errors: null }
            res.status(200).json(result);
          }
        });
      }
    ], function(err) {
      if (err) return next(err);
      var result = { message: "There was an error", errors: err }
      res.status(400).json(result);
    });
  });

  router.get('/reset/:token', function(req, res) {
    Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, account) {
      if (!account) {
        return res.render('forgot', { title: title, message: "Password reset token is invalid or has expired.", errors: err })
      }
      res.render('reset', { title: title, account: accountLoggedIn(req), the_account: req.user, token:req.params.token });
    });
  });

  router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, account) {
          if (!account) {
            var result = { message: "Password reset token is invalid or has expired.", errors: err }
            return res.status(400).json(result);
          }

          //TODO validate password and confirmation
          account.password = req.body.password;
          account.resetPasswordToken = undefined;
          account.resetPasswordExpires = undefined;

          account.save(function(err) {
            req.logIn(account, function(err) {
              done(err, account);
            });
          });
        });
      },
      function(account, done) {
        var smtpTransport = nodemailer.createTransport('SMTP', {
          service: 'SendGrid',
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD
          }
        });
        var mailOptions = {
          to: account.email,
          from: process.env.SENDGRID_FROM,
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + account.email + ' has just been changed.\n',
          html: "<h2> Hello </h2> <p> This is a confirmation that the password for your account " +account.email+" has just been changed.</p>"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      if (err){
        var result = { message: "An error has ocurred.", errors: err }
        return res.status(400).json(result);
      }else{
        var result = { message: "Your password has been changed.", errors: null, redirect: '/widget' }
        return res.status(200).json(result);
      }
    });
  });

  function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
  }

  function accountLoggedIn(req) {
    if (req.isAuthenticated())
      return true;
    else
      return false;
  }

  return router;
}
