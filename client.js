const WebSocket = require('ws');
const {ECDH, ChaCha20} = require('cryptopeer-crypto');

function client(host, port, secret) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${host}:${port}/?secret=${secret}`);
        
        let ownKey;
        let sharedKey;

        const send = (type, payload) => {
            ws.send(JSON.stringify({type, payload}));
        };
        
        const sendMessage = function(message) {
            send('message', encrypt(message));
        };
        
        const encrypt = function(message) {
            const nonce = ChaCha20.getNonce();
            
            return {
                nonce: nonce.toString('hex'),
                message: ChaCha20.encrypt(message, nonce, sharedKey).toString('hex'),
            };
        }
        
        const decrypt = function({message, nonce}) {
            const result = ChaCha20.decrypt(
                Buffer.from(message, 'hex'),
                Buffer.from(nonce, 'hex'),
                sharedKey
            );
            
            return result ? result.toString('utf8') : null;
        };
    
        ws.on('message', (data) => {
            let values;
            try {
                values = JSON.parse(data);
            } catch (err) {
                ws.emit('error', new Error(`Invalid message: ${data}`));
                return;
            }
            
            const {type, payload} = values;
            
            switch (type) {
                // Exchange part
                case 'ready':
                    // Ready message is received when both of chat room memgers are connected.
                    // Create public and secret keys
                    ownKey = new ECDH();
                    // Send public key to another person
                    send('key', {
                        key: ownKey.publicKeyTo('hex'),
                    });
                    break;
                case 'key':
                    // Key exchange round
                    // Create shared key
                    sharedKey = ownKey.computeSecret(payload.key, 'hex');
                    sendMessage(process.argv[3]);
                    break;
                case 'message':
                    // Message received
                    const message = decrypt(payload);
                    
                    console.log('>', message);
                    ws.close();
                    
                    break;
                case 'exit':
                    console.log('Session closed');
                    break;
            }
        });
        
        ws.on('close', resolve);
        ws.on('error', reject);
    });
}

client('localhost', 9000, process.argv[2])
.catch((error) => {
    console.error(error);
    process.exit(1);
});