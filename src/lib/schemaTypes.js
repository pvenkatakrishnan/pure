/* @flow */

// User
export type User = {
	counts: { [key: string]: number };
	createTime: number;
	deleteTime: number;
	id: string;
	identities: Array<string>;
	locale: number;
	name: string;
	params: Object;
	presence: number;
	presenceTime: number;
	resources: { [key: string]: number };
	tags: Array<number>;
	timezone: number;
	type: number;
	updateTime: number;
};

// Room, Text, Thread, Topic, Priv
export type Item = {
	body: string;
	counts: { [key: string]: number };
	createTime: number;
	creator: string;
	deleteTime: number;
	id: string;
	identities?: Array<string>;
	meta: Object;
	name: string;
	params?: Object;
	parents: Array<string>;
	score?: number;
	tags: Array<number>;
	type: number;
	updater: string;
	updateTime: number;
};

// RoomRel, TextRel, ThreadRel, TopicRel, PrivRel
export type Relation = {
	admin: boolean;
	expireTime: number;
	interest: number;
	item: string;
	message: string;
	presence: number;
	presenceTime: number;
	resources: { [key: string]: number };
	roles: Array<number>;
	roleTime: string;
	tags: Array<string>;
	transitRole: number;
	transitType: number;
	type: number;
	user: string;
};

// Note
export type Note = {
	count: number;
	data: Object;
	dismissTime: number;
	event: number;
	eventTime: number;
	group: string;
	id: string;
	readTime: number;
	score: number;
	type: number;
	user: string;
};