"use strict";

/*
Utilities for creating peer-to-peer connections.
Depends on lib/lzma.js for compression.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Basic usage:
(NB: "SDP" = Session Description Protocol)
(NB: "server" and "client" are both peers))

// Server sets up N connections (in this case, two, "Alpha" and "Bravo")
const serverInfo = await PeerUtil.pInitialiseServers(
	["Alpha", "Bravo"],
	msg => console.log("server", msg),
	err => console.error("server", err)
);
// Server user then sends each `serverInfo[N].textifiedSdp` token to client user N, e.g. via Discord
//   the string is of the form: `{::alpha|...base64 data...::}`
// Each client user inputs their token into their client
const clientInfo1 = await PeerUtil.pInitialiseClient(
	serverInfo[0].textifiedSdp,
	msg => console.log("client 1", msg),
	err => console.error("client 1", err)
);
const clientInfo2 = await PeerUtil.pInitialiseClient(
	serverInfo[1].textifiedSdp,
	msg => console.log("client 2", msg),
	err => console.error("client 2", err)
);
// Each client will produces a response token of the same format, which the client user sends back to the
//   server user, again e.g. via Discord
// The server user then copy-pastes all the client tokens into the server. These tokens can be mixed in with
//   other text, e.g. copied en-masse from a chat log
await PeerUtil.pConnectClientsToServers(serverInfo, `[02:16] Client Username 1: This should work, right?${clientInfo1.textifiedSdp}[02:17] Client Username 2: Let's hope so...${clientInfo2.textifiedSdp}`);
// The server can now send data to the clients
serverInfo.forEach(s => s.server.sendMessage("Hello world"));
 */

const STUN_SERVERS = [
	`stun1.l.google.com:19302`,
	`stun2.l.google.com:19302`,
	`stun3.l.google.com:19302`,
	`stun4.l.google.com:19302`
];

class Peer {
	constructor (role) {
		this._role = role;

		this._ctx = null;
		this._isActive = false;
		this._isClosed = false;

		this._pChannel = null;
	}

	get isActive () { return this._isActive; }
	get isClosed () { return this._isClosed; }

	_createPeerConnection (msgHandler, errHandler) {
		errHandler = errHandler || (evt => setTimeout(() => { throw new Error(evt); }));

		const thisMsgHandler = msgHandler.bind(this);
		const thisErrHandler = errHandler.bind(this);

		const pc = new RTCPeerConnection({iceServers: STUN_SERVERS.map(url => ({url: `stun:${url}`}))});

		this._pChannel = new Promise(resolve => {
			pc.addEventListener("datachannel", evt => {
				evt.channel.addEventListener("message", evt => thisMsgHandler(JSON.parse(evt.data)));

				// only closes local side of the connection
				evt.channel.addEventListener("close", () => {
					this._ctx = null;
					this._isActive = false;
					this._isClosed = true;
				});

				evt.channel.addEventListener("error", evt => thisErrHandler(evt));

				resolve();
			});
		});

		const dc = pc.createDataChannel(this._role);
		return {pc, dc};
	}

	close () {
		if (this._ctx) this._ctx.pc.close();
		else {
			this._isActive = false;
			this._isClosed = true;
		}
	}

	/**
	 * STAGE 5: Send messages.
	 *
	 * @param toSend Data to be sent.
	 */
	async sendMessage (toSend) {
		if (!this._isActive) throw new Error(`Connection is not active!`);

		const packet = {
			head: {
				type: this._role,
				version: "0.0.1"
			},
			data: toSend
		};

		this._ctx.dc.send(JSON.stringify(packet));
	}
}

class PeerServer extends Peer {
	constructor () {
		super("server");
	}

	/**
	 * STAGE 1: Make offer.
	 *
	 * @param messageHandler Function which handles received messages.
	 * @param errorHandler Function which handles errors.
	 * @return {Promise<String>} session description to be provided (manually, e.g. via Discord) to a client
	 */
	async pMakeOffer (messageHandler, errorHandler) {
		return new Promise((resolve, reject) => {
			this._ctx = this._createPeerConnection(messageHandler, errorHandler);

			this._ctx.pc.addEventListener("icecandidate", evt => {
				if (!evt.candidate) resolve(this._ctx.pc.localDescription.sdp);
			});

			this._ctx.pc.createOffer()
				.then(offer => this._ctx.pc.setLocalDescription(offer))
				.catch(err => reject(err));
		});
	}

	/**
	 * STAGE 4: Accept answer.
	 *
	 * @param sdpAnswer
	 */
	async pAcceptAnswer (sdpAnswer) {
		const answer = new RTCSessionDescription({type: "answer", sdp: `${(sdpAnswer || "").trim()}\n`});
		await this._ctx.pc.setRemoteDescription(answer);
		await this._pChannel;
		this._isActive = true;
	}
}

class PeerClient extends Peer {
	constructor () {
		super("client");
	}

	/**
	 * STAGE 3: Receive offer, and produce answer.
	 * @return {Promise<String>} session description to be provided (manually, e.g. via Discord) to a server
	 */
	async pReceiveOfferAndGetAnswer (sdpOffer, messageHandler, errorHandler) {
		return new Promise((resolve, reject) => {
			this._ctx = this._createPeerConnection(messageHandler, errorHandler);

			const offer = new RTCSessionDescription({type: "offer", sdp: `${(sdpOffer || "").trim()}\n`});

			this._ctx.pc.setRemoteDescription(offer).then(() => {
				this._ctx.pc.addEventListener("icecandidate", evt => {
					if (!evt.candidate) {
						this._isActive = true;
						resolve(this._ctx.pc.localDescription.sdp);
					}
				});

				this._ctx.pc.createAnswer()
					.then(answer => this._ctx.pc.setLocalDescription(answer))
					.catch(err => reject(err));
			});
		});
	}
}

// Utilities for easing the process of connecting multiple clients
class PeerUtil {
	/**
	 * Convenience wrapper to initialise multiple servers ad produce a textified version of their SDPs, suitable for
	 *   text transmission.
	 *
	 * @param names An array of unique-when-sluggified names to give to each server.
	 * @param msgHandler One copy used per server.
	 * @param errHandler One copy used per server.
	 * @param options An object containing options, which are:
	 *   `shortTokens` True if tokens should be shortened using b256.
	 * @return {Promise<Array<Object>>} An array of objects of the form `{name<String>, textifiedSdp<String>, server<PeerServer>}`.
	 */
	static async pInitialiseServers (names, msgHandler, errHandler, options) {
		options = options || {};
		names = names.map(it => Parser.stringToSlug(it).toUpperCase());

		// ensure name uniqueness
		if (names.length !== (new Set(names)).size) {
			const nameCounts = {};
			names.forEach(n => nameCounts[n] = (nameCounts[n] || 0) + 1);
			names = [];
			Object.entries(nameCounts).forEach(([name, count]) => {
				names.push(name);
				[...new Array(count - 1)].forEach((_, i) => names.push(`${name}-${i + 1}`));
			});
		}

		return PeerUtil._pMapNamesToServers(names, msgHandler, errHandler, options);
	}

	static async _pMapNamesToServers (names, msgHandler, errHandler, options) {
		options = options || {};
		return Promise.all(names.map(async name => {
			const server = new PeerServer();
			const sdpServer = await server.pMakeOffer(msgHandler, errHandler);

			return {
				name,
				textifiedSdp: PeerUtil._packToken(name, sdpServer, !!options.shortTokens),
				server
			};
		}));
	}

	/**
	 * Convenience method for adding more servers to a list previously created by `pInitialiseServers`, ensuring names
	 *   are unique across all servers.
	 *
	 * @param names The desired names for the new servers.
	 * @param existing The array of existing server metadata, as created by `pInitialiseServers` -- `isDeleted` flags
	 *   set on the metadata will be respected when determining this server's final name.
	 * @param msgHandler Ideally, the same handler as the `existing` metadata used.
	 * @param errHandler Ideally, the same handler as the `existing` metadata used.
	 * @param options An object containing options, which are:
	 *   `shortTokens` True if tokens should be shortened using b256.
	 * @return {Promise<Array<Object>>} An array of the new server metadata; `{name<String>, textifiedSdp<String>, server<PeerServer>}`.
	 */
	static async pInitialiseServersAddToExisting (names, existing, msgHandler, errHandler, options) {
		options = options || {};
		const existingNames = existing.filter(it => !it.isDeleted).map(it => it.name);
		names = names.map(name => {
			name = PeerUtil.getNextAvailableName(existingNames, name);
			existingNames.push(name);
			return name;
		});

		const newServers = await PeerUtil._pMapNamesToServers(names, msgHandler, errHandler, options);
		existing.push(...newServers);
		return newServers;
	}

	/**
	 * @param existingSlugNames An array of existing slugified names.
	 * @param desiredName The desired (plain text) name.
	 */
	static getNextAvailableName (existingSlugNames, desiredName) {
		existingSlugNames = new Set(existingSlugNames.map(n => n.replace(/-/g, " ").toUpperCase()));
		const slugName = Parser.stringToSlug(desiredName).toUpperCase();
		if (!existingSlugNames.has(slugName)) return slugName;

		let n = 1;
		let nextName = `${slugName}-${n}`;
		while (existingSlugNames.has(nextName)) {
			n++;
			nextName = `${slugName}-${n}`;
		}
		return nextName;
	}

	static _packToken (name, sdp, b256) {
		sdp = sdp.trim();

		function stripEquals () {
			return sdp.split("\n").map(it => it.trim().replace(/^(.)=/, "$1")).join("\n");
		}

		const cleaned = stripEquals(sdp);

		const mapped = (() => {
			function stripHeader (bytes) {
				if (bytes.slice(0, 5).equals(PeerUtil.LZMA_HEADER)) return bytes.slice(5);
				return bytes;
			}

			if (b256) {
				const compressed = LZMA.compress(cleaned, 1);
				return stripHeader(compressed)
					.map(num => num + 128)
					.map(num => PeerUtil.CHAR_MAP[num])
					.join("");
			} else return btoa(cleaned);
		})();

		return `{::${name}|${b256 ? "2" : "1"}|${mapped}::}`;
	}

	static _unpackToken (textified) {
		const parts = textified.replace(/\s+/g, "").replace(/^{::/, "").replace(/::}$/, "").split("|");
		if (parts.length === 3) {
			const [name, compression, mappedCompressed] = parts;
			if (compression === "2") {
				const cleaned = [...mappedCompressed].map(it => PeerUtil.CHAR_MAP.indexOf(it) - 128);
				if (!cleaned.slice(0, 3).equals([93, 0, 0])) {
					cleaned.unshift(...PeerUtil.LZMA_HEADER);
				}
				const decompressed = LZMA.decompress(cleaned);
				const withEquals = decompressed.split("\n").map(it => it.replace(/^(.)/, "$1=")).join("\n");
				return {name, sdp: withEquals}
			} else if (compression === "1") {
				const withEquals = atob(mappedCompressed).split("\n").map(it => it.replace(/^(.)/, "$1=")).join("\n");
				return {name, sdp: withEquals}
			} else throw new Error(`Unknown compression type "${compression}"`);
		} else return null;
	}

	static _getTokensFromText (clientsString) {
		const nameToSdpData = {};

		clientsString = clientsString.replace(/\s+/g, "");
		// tolerate single missing characters at start/end, to ease copy-pasting
		if (clientsString.startsWith("::")) clientsString = `{${clientsString}`;
		if (clientsString.endsWith("::")) clientsString = `${clientsString}}`;

		clientsString.replace(/{::([^:])+::}/gi, (...m) => {
			const unpacked = PeerUtil._unpackToken(m[0]);
			if (unpacked) {
				nameToSdpData[unpacked.name] = {
					sdp: unpacked.sdp,
					token: m[0] // pass back the original token, to be displayed as required
				};
			}
		});

		return nameToSdpData;
	}

	/**
	 * Test if a string contains any tokens.
	 * @param string A string.
	 */
	static containsAnyTokens (string) {
		return !!Object.keys(PeerUtil._getTokensFromText(string)).length;
	}

	/**
	 * @param wrappedServers An array of objects produced by `pInitialiseServers`.
	 * @param clientsString A string containing one or more textified name/SDP pairs created by `_packToken`. This string can contain other
	 *   junk characters, e.g. copy-pasted from a chat containing timestamps.
	 * @return {Promise<Array<Object>>} An array of the server metadata for servers which were connected.
	 */
	static async pConnectClientsToServers (wrappedServers, clientsString) {
		const nameToSdpData = PeerUtil._getTokensFromText(clientsString);

		const connectedServers = [];
		await Promise.all(Object.entries(nameToSdpData).map(async ([name, sdpData]) => {
			const wrappedServer = wrappedServers.find(server => server.name === name);
			if (wrappedServer) {
				await wrappedServer.server.pAcceptAnswer(sdpData.sdp);
				wrappedServer._tempTokenToDisplay = sdpData.token;
				connectedServers.push(wrappedServer);
			}
		}));
		return connectedServers;
	}

	static async pInitialiseClient (textifiedSdp, msgHandler, errHandler, options) {
		options = options || {};
		const client = new PeerClient();
		const unpacked = PeerUtil._unpackToken(textifiedSdp);
		if (unpacked) {
			const {name, sdp} = unpacked;
			const sdpClient = await client.pReceiveOfferAndGetAnswer(sdp, msgHandler, errHandler);
			return {
				name,
				textifiedSdp: PeerUtil._packToken(name, sdpClient, !!options.shortTokens),
				client
			};
		} else return null;
	}

	/**
	 * Performs a basic sanity check on a token.
	 */
	static isValidToken (token) {
		if (!token || typeof token !== "string" || !token.trim()) return false;
		return !!/{::[^:]+::}/.exec(token);
	}
}
PeerUtil.LZMA_HEADER = [93, 0, 0, 1, 0];
// "base256"
PeerUtil.CHAR_MAP = "აბგ?ევზ_იკ€მნოპჟრსტუფქღყშჩცძწჭხ#ჰÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгдежзийклмнопрстуфхцчшщьюя.,=>'\"!£$%^&()[]-+;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΑαΒβΓγΔδΕεΖζΗηΘθΙιΚκΛλΜμΝνΞξΟοΠπΡρΣσςΤτΥυΦφΧχΨψΩω";
