let nodemailer = require("nodemailer"),
	log = require("../../lib/logger"),
	transport, config;

function send(from, to, sub, html) {
		let email = {
			from: from,
			to: to,
			subject: sub,
			html: html,
			bcc: config.bcc || ""
		};
		
		transport.sendMail(email, (e) => {
			if(e) {
				log.d("error in sending email: ",e, "retrying...");
				setTimeout(() => {
					send(email.from, email.to, email.subject, email.html);
				},300000);
			} else log.i("Email sent successfully to ", email.to);
		});
};

module.exports = (conf, from, to, sub, html) => {
	config = conf;
	transport = nodemailer.createTransport("SMTP", {
		host: "email-smtp.us-east-1.amazonaws.com",
		secureConnection: true,
		port: 465,
		auth: config && config.auth
	});
	send(from, to, sub, html);
};