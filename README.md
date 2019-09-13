# blockchain-api

# Description
[Blockchain API](https://github.com/IvanDurak0/blockchain-api) provides easy and understandable way to work with blockchain.

You can create / send transactions, generate wallets (now only BTC and LTC),
 check balance and much more.

# Install
The [blockchain-api](https://github.com/IvanDurak0/blockchain-api) library is exported as a npm module.
```shell
$ npm install @ivandurak0/blockchain-api
```

# Usage
To use this lib you need to run blockchain service first.

Bitcoin full node now is about 300GB total, but for some operations it is enough to run it in pruned mode (with this option you can decrease disk usage up to 10GB)

After you have your favorite blockchain running on your server, using this lib becomes easy

```js
// Import blockchain api class in your module
const BlockChainApi = require('@ivandurak0/blockchain-api');

// Create instance of api class
// host - host of server where your blockchain is running
// port - port on which blockchain is listening for api calls
// username - user specified in config file of your blockchain service
// password - password
const blockchainApi = new BlockChainApi('host', 'port', 'username', 'password');
```

# Example of creating BTC wallet

```js
// Raw private key
// Must be secret!!!
const rawPrivateKey = blockchainApi.getRawPrivateKey();

// Encoded private key in Wallet Import Format
// Used to sign your transactions, import your wallet somewhere
// Don't tell it anyone!!! It must be secret to prevent losing money from your wallet
const privateKey = blockchainApi.getPrivateKeyBTC(rawPrivateKey);

// Address is used to get and store your crypto currency
// You can tell it to your friends so that they could transfer money to you
const addressBTC = blockchainApi.getAddressBTC(rawPrivateKey);
```


# Example of sending transaction

```js
// In this example we will transfer all money from one wallet to another


// Get all unspent transactions from wallet
blockchainApi.listUnspent([1, 9999999, ["your_first_wallet_address"]], (response) => {
    if(response.error) {
        console.log("An error occured", response.error);
        return;
    }
    
    let totalAmount = 0;
    const inputs = [];
    const output = {};
    
    // Transactions with 6+ confirmations are considered safe
    response.result.filter(t => t.confirmations >= 6).forEach((t) => {
       totalAmount += t.amount;
       inputs.push({
           txid: t.txid,
           vout: t.vout
       });
    });
    
    // 2% of total amount are used as a transaction fee, you can use any other amount if you want
    output["your_second_wallet_address"] = (totalAmount * 0.98).toFixed(8);
   
    blockchainApi.createRawTransaction([inputs, output], (rawTransaction) => {
        if(!rawTransaction.result) {
            console.log("An error occured");
            return;
        }
        blockchainApi.signRawTransactionWithKey([rawTransaction.result, ["your_first_wallet_private_wif"]],
            (signedTransaction) => {
                if (!signedTransaction.result) {
                    console.log("An error occured");
                    return;
                }
                blockchainApi.sendRawTransaction([signedTransaction.result.hex], (transaction) => {
                    console.log("Success!!!", transaction);
                });
            });
    });
});
```

# Support
You can support this project and transfer BTC to this address:

1NBAH44o8zCY4WXQnpnksk1JjE6aPu9BfC