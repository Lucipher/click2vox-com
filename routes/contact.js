// This module is to put all the functionality related to
// Contacts management

var express = require('express');
var router = express.Router();

var async = require('async');

var Contact = require('../models/contact');

router.post('/contact', function (req, res, next) {
  var formData = req.body;
  var result = { message: "", errors: null };

  if (!formData.email || !formData.name) {
    result.message = "Validation failed.";
    return res.status(400).json(result);
  }

  Contact.findOne({ email: formData.email }, function (err, theContact) {
    if (theContact) {
      result.message = "Contact already registered";
      return res.status(409).json(result);
    } else {
      theContact = new Contact(
        {
          email: formData.email,
          name: formData.name,
          reference: formData.reference
        }
      );
    }
    result.errors = false;

    theContact.save(function (err) {
      if (err) return res.status(500).json(result);
      return res.status(200).json(result);
    });
  });
});

module.exports = router;