"use strict";

class NewPeer extends Peer {
	constructor () {
		super();
		this._role = null;
		this._connectionsArray = [];
	}

	async sendMessage (toSend) {
		if (this.disconnected || this.destroyed) throw new Error(`Connection is not active!`);

		const packet = {
			head: {
				type: this._role,
				version: "0.0.2"
			},
			data: toSend
		};
		this.connections.forEach(connection => {
			connection.send(packet);
		});
	}
}

class NewServerPeer extends NewPeer {
	constructor () {
		super();
		this._role = "server";
		this.on("connection", this.newConnection)
	}

	get token () { return this.id; }

	newConnection (conn) {
		this._connectionsArray.push(conn);
		const toSend = "Test packet"
		const packet = {
			head: {
				type: this._role,
				version: "0.0.2"
			},
			data: toSend
		};

		this.connections.forEach((connection) => {
			connection.send(JSON.stringify(packet));
		});
	}
	get connections () { return this._connectionsArray; }
}

class NewClientPeer extends NewPeer {
	constructor () {
		super();
		this._role = "client";
		this._data = null;
	}

	async connectToServer (token, options = null) {
		if (options) {
			this._connection = this.connect(token, options)
		} else {
			this._connection = this.connect(token);
		}
	}

	async sendMessage (toSend) {
		if (!this._isActive) throw new Error(`Connection is not active!`);

		const packet = {
			head: {
				type: this._role,
				version: "0.0.2"
			},
			data: toSend
		};
		this._connection.send(JSON.stringify(packet));
	}
}
