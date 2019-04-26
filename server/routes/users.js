const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const Joi = require("joi");
const router = express.Router();
const { ensureAuthenticated } = require("../helpers/auth");

// load user model
require("../models/User");
const User = mongoose.model("users");

// load users
router.get("/", ensureAuthenticated, (req, res) => {
  User.find({ isAdmin: false })
    .sort({ name: "asc" })
    .then(users => {
      res.render("users/index", {
        users: users
      });
    });
});

//user login route
router.get("/login", (req, res) => {
  res.render("users/login");
});

//user register route
router.get("/register", (req, res) => {
  res.render("users/register");
});

// login form post
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/api/users/login",
    failureMessage: true,
    failureFlash: true
  })(req, res, next);
});

// email validate func
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
// register form post
router.post("/register", (req, res) => {
  let errors = [];
  if (req.body.password !== req.body.password2) {
    errors.push({ text: "Passwords do not match." });
  }
  if (req.body.password.length < 4 || req.body.password.length > 10) {
    errors.push({
      text:
        "Password must be more than 4 characters and less than 10 characters."
    });
  }
  if (
    req.body.name.length < 1 ||
    req.body.name.length > 20 ||
    typeof req.body.name !== "string"
  ) {
    errors.push({
      text:
        "Name must be more than 1 characters and less than 20 characters String."
    });
  }
  if (validateEmail(req.body.email) === false) {
    errors.push({ text: "Invalid email" });
  }
  if (errors.length > 0) {
    res.render("users/register", {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    });
  } else {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (user) {
          req.flash("error_msg", "Email already registered");
          res.redirect("/api/users/register");
        } else {
          let bool1;
          req.body.isPremium === "on" ? (bool1 = true) : (bool1 = false);
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone,
            isAdmin: false,
            isPremium: bool1
          });
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  req.flash(
                    "success_msg",
                    "You are now registered. you can Log in."
                  );
                  res.redirect("/api/users/login");
                })
                .catch(err => {
                  console.log(err);
                  return;
                });
            });
          });
        }
      })
      .catch(err => {
        console.log(err);
        return;
      });
  }
});

router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are logged out.");
  res.redirect("/api/users/login");
});

module.exports = router;
