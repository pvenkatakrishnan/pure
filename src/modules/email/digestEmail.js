/* eslint max-nested-callbacks: 0 */
import getMailObj from './buildMailObj';
import { Constants, config } from '../../core';
import log from 'winston';
import fs from 'fs';
import handlebars from 'handlebars';
import * as pg from '../../lib/pg';
import jwt from 'jsonwebtoken';
import send from './sendEmail';
import Counter from '../../lib/counter';
const DIGEST_INTERVAL = 60 * 60 * 1000, DIGEST_DELAY = 24 * 60 * 60 * 1000,
	template = handlebars.compile(fs.readFileSync(__dirname + '/views/' + config.appName + '.digest.hbs', 'utf-8')),
	connStr = config.connStr, conf = config.email, counter1 = new Counter();

let lastEmailSent, end;


function getSubject(rels) {
	const counts = rels.length - 1;
	const heading = '[' + rels[0].room + '] ' + rels[0].threads[0].threadTitle + ' +' + counts + ' more';

	return heading;
}

export function initMailSending (userRel) {
	counter1.inc();
	// console.log("counter1.pending: ", counter1.pending)
	const user = userRel.currentUser,
		rels = userRel.currentRels,
		emailAdd = user.identities[0].slice(7),
		emailHtml = template({
			token: jwt.sign({ email: emailAdd }, conf.secret, { expiresIn: '5 days' }),
			domain: conf.domain,
			rooms: rels
		}),
		emailSub = getSubject(rels);

	send(conf.from, emailAdd, emailSub, emailHtml, (e) => {

		if (!e) {
			log.info('Digest email successfully sent');
			counter1.dec();
			// console.log('counter1.pending: ',counter1.pending)
			counter1.then(() => {
				pg.write(connStr, [ {
					$: 'UPDATE jobs SET lastrun=&{end} WHERE jobid=&{jid}',
					end,
					jid: Constants.JOB_EMAIL_DIGEST
				} ], (error) => {
					if (!error) log.info('successfully updated jobs for digest email');
				});
			});
		}
	});
}

function sendDigestEmail () {
	const startPoint = Date().now - 2 * DIGEST_DELAY,
		counter = new Counter();

	end = Date.now() - DIGEST_DELAY;
	let	start = lastEmailSent < startPoint ? lastEmailSent : startPoint;

	function getTimezone(hour) {
		const UtcHrs = new Date().getUTCHours(),
			c = UtcHrs > 12 ? 24 - UtcHrs : UtcHrs,
			d = c > hour ? c - hour : hour - c,
			tz = d * 60,
			tzMin = tz - 30,
			tzMax = tz + 30;

		return { min: tzMin, max: tzMax };
	}

	const tz = getTimezone(conf.digestEmailTime);

//	console.log(tz);
	if (conf.debug) {
		start = 0; end = Date.now(); tz.min = 0; tz.max = 1000;
	}

	pg.readStream(config.connStr, {
		$: `with urel as (select rrls.presencetime ptime, * from users join roomrels rrls on users.id=rrls.user where roles @> '{3}' and rrls.presencetime >= &{start} and rrls.presencetime < &{end} and timezone >= &{min} and timezone < &{max}) select * from urel join threads on threads.parents[1]=urel.item where threads.createtime > urel.ptime order by urel.id`, // where threads.createtime > urel.ptime
		start,
		end,
		follower: Constants.ROLE_FOLLOWER,
		min: tz.min,
		max: tz.max
	}).on('row', (urel) => {

		counter.inc();
		pg.read(config.connStr, {
			$: `select * from rooms where id=&{id} `, // and presencetime<&{roletime}
			id: urel.parents[0]
		}, (err, room) => {
			if (err) throw err;
			urel.roomName = room[0].name;
			// console.log(urel)
			const emailObj = getMailObj(urel) || {};

// console.log(emailObj)
			if (Object.keys(emailObj).length !== 0) {
				initMailSending(emailObj);

			}
			counter.dec();
			counter.then(() => {
				const c = getMailObj({});

				initMailSending(c);
			});
		});
	}).on('end', () => {
		log.info('ended');
	});
}

export default function (row) {
	lastEmailSent = row.lastrun;
	const UtcMnts = new Date().getUTCMinutes(),
		delay = UtcMnts < 30 ? 30 : 90,
		after = conf.debug ? 0 : (delay - UtcMnts) * 60000;

	setTimeout(() => {
		sendDigestEmail();
		setInterval(sendDigestEmail, DIGEST_INTERVAL);
	}, after);
}
