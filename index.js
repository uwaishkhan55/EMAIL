/** @format */
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
require("./passport-setup");
const nodemailer = require("nodemailer");
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// For an actual app you should configure this with an experation time, better keys, proxy and secure
app.use(
	cookieSession({
		name: "gmail-cookie",
		keys: ["key1", "key2"],
	})
);

// Auth middleware that checks if the user is logged in
const isLoggedIn = (req, res, next) => {
	if (req.user) {
		next();
	} else {
		res.sendStatus(401);
	}
};

// Initializes passport and passport sessions
app.use(passport.initialize());
app.use(passport.session());

// Example protected and unprotected routes
app.get("/", (req, res) => res.send("Example Home page!"));
app.get("/failed", (req, res) => res.send("You Failed to log in!"));

// In this route you can see that if the user is logged in u can acess his info in: req.user
app.get("/good", isLoggedIn, (req, res) =>
	res.send(`Welcome mr ${req.user.emails[0].value}!`)
);

// Auth Routes
app.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
	"/google/callback",
	passport.authenticate("google", { failureRedirect: "/failed" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/good");
	}
);

app.get("/logout", (req, res) => {
	req.session = null;
	req.logout();
	res.redirect("/");
});

const transport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		type: "OAuth2",
		user: "your email here", //your gmail account you used to set the project up in google cloud console"
		clientId: " Client ID Here",
		clientSecret: "Client Secret Here",
		refreshToken: "Refresh Token Here",
		accessToken: myAccessToken, //access token variable we defined earlier
	},
});
app.post("/sendemail", isLoggedIn, function (req, res) {
	const mailOptions = {
		from: req.user.emails[0].value, // sender
		to: req.body.email, // receiver
		subject: req.body.message, // Subject
		html:
			"<p>You have received this email using nodemailer, you are welcome ;)</p>", // html body
	};
	transport.sendMail(mailOptions, function (err, result) {
		if (err) {
			res.send({
				message: err,
			});
		} else {
			transport.close();
			res.send({
				message: "Email has been sent: check your inbox!",
			});
		}
	});
});

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`));
