# Crypto Chat Example

This is a simple realtime only chat with end-to-end encryption. This repository
is just an example and should not be used as complete solution for information
security system without addintional server configuration. Also it doesn't protect
members from MITM attack without some security additions (you can use
SSL-certificate for it).

## Cryptography

This chat use ECDH (Diffie-Hellman) algorythm to safely exchange encryption keys
using central server. Chat uses ChaCha20 algorithm to encript message content.
ChaCha20 is [recommended by Google](https://tools.ietf.org/html/draft-ietf-tls-chacha20-poly1305-04) as TLS protocol.

## Example

Run server

```shell
node server.js
```

In another two terminals run clients. Client usage is:
`node client.js <ROOM> <Message>`:

```shell
# Client 1
node client.js my-secret-room-id "Hello client 2"
```

```shell
# Client 2
node client.js my-secret-room-id "Hello client 1"
```

After calling this both clients should be terminated.

## License

MIT.