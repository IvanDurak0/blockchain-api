const secureRandom = require('secure-random');
const elliptic = require('elliptic').ec;
const ecdsa = new elliptic('secp256k1');
const sha256 = require('js-sha256');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
const request = require('request');

const methods = [
    'getNewAddress',
    'getAddressesByAccount',
    'getInfo',
    'getNetTotals',
    'getBalance',
    'getReceivedByAddress',
    'sendToAddress',
    'listTransactions',
    'getTransaction',
    'importAddress',
    'importPrivKey',
    'getBlockChainInfo',
    'listUnspent',
    'createRawTransaction',
    'signRawTransactionWithKey',
    'sendRawTransaction'
];

class BlockChainApi {
    constructor(host, port, username, password) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
    };

    getRawPrivateKey() {
        const max = Buffer.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140", 'hex');
        let isInvalid = true;
        let privateKey;
        while (isInvalid) {
            privateKey = secureRandom.randomBuffer(32);
            if (Buffer.compare(max, privateKey) === -1) {
                isInvalid = false;
            }
        }
        return privateKey.toString('hex');
    };

    getAddressBTC(rawPrivateKey) {
        const publicKey = ecdsa.keyFromPrivate(rawPrivateKey).getPublic('hex');
        let hash = sha256(Buffer.from(publicKey, 'hex'));
        hash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();
        hash = '00' + hash.toString('hex');

        let checksum = sha256(Buffer.from(hash, 'hex'));
        checksum = sha256(Buffer.from(checksum, 'hex'));
        checksum = checksum.slice(0, 8);
        const address = hash.toString('hex') + checksum;
        return base58.encode(Buffer.from(address, 'hex'));
    };

    getAddressLTC(rawPrivateKey) {
        const publicKey = ecdsa.keyFromPrivate(rawPrivateKey).getPublic('hex');
        let hash = sha256(Buffer.from(publicKey, 'hex'));
        hash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();
        hash = '30' + hash.toString('hex');

        let checksum = sha256(Buffer.from(hash, 'hex'));
        checksum = sha256(Buffer.from(checksum, 'hex'));
        checksum = checksum.slice(0, 8);
        const address = hash.toString('hex') + checksum;
        return base58.encode(Buffer.from(address, 'hex'));
    };

    getPrivateKeyBTC(rawPrivateKey) {
        if (!rawPrivateKey) {
            return this.getPrivateKeyBTC(this.getRawPrivateKey());
        }
        const step1 = Buffer.from("80" + rawPrivateKey, 'hex');
        const step2 = sha256(step1);
        const step3 = sha256(Buffer.from(step2, 'hex'));
        const checksum = step3.substring(0, 8);
        const step4 = step1.toString('hex') + checksum;
        return base58.encode(Buffer.from(step4, 'hex'));
    };

    getPrivateKeyLTC(rawPrivateKey) {
        if (!rawPrivateKey) {
            return this.getPrivateKeyLTC(this.getRawPrivateKey());
        }
        const step1 = Buffer.from("b0" + rawPrivateKey, 'hex');
        const step2 = sha256(step1);
        const step3 = sha256(Buffer.from(step2, 'hex'));
        const checksum = step3.substring(0, 8);
        const step4 = step1.toString('hex') + checksum;
        return base58.encode(Buffer.from(step4, 'hex'));
    };

    sendRequest(method, params, callback) {
        if (methods.indexOf(method) === -1) {
            throw new Error('Wrong method name ' + method)
        }

        if (callback === undefined) {
            callback = () => {
            };
        }


        const body = JSON.stringify({
            jsonrpc: '1.0',
            method: method.toLowerCase(),
            params: params,
        });

        const options = {
            url: "http://" + this.host + ":" + this.port,
            method: "post",
            headers: {"content-type": "text/plain"},
            auth: {
                user: this.username,
                pass: this.password
            },
            body: body
        };

        request(options, (error, response, body) => {
            if (error) {
                callback(error);
            } else {
                try {
                    callback(null, JSON.parse(body));
                } catch (e) {
                    callback(null, body);
                }
            }
        });
    };
}


methods.forEach((method) => {
    BlockChainApi.prototype[method] = function (m) {
        return function (params, callback) {
            this.sendRequest(m, params, callback)
        };
    }(method);
});

module.exports = BlockChainApi;