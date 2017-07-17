const {createServer} = require('http');
const {Server} = require('ws');
const {parse} = require('url');
// Output colorization library
const chalk = require('chalk');

// Chat rooms
const rooms = new Map();

const server = createServer();
const wss = new Server({
    server,
});

wss.on('connection', (conn, req) => {
    const {query:{secret}} = parse(req.url, {query: true});
        
    const send = function(type, payload = {}, toAll = false) {
        const members = rooms.get(secret);
        const message = JSON.stringify({type, payload});
        
        members.forEach((member) => {
            if (toAll !== true && member === conn) {
                return;
            }
            else if (member.closed) {
                return;
            }
            
            member.send(message);
        });
    };
    
    if (! rooms.has(secret)) {
        rooms.set(secret, [conn]);
        console.log('New room', chalk.bold('created'));
    }
    else {
        let members = rooms.get(secret);
        if (members.length > 1) {
            // OnlyThere is could only 2 members.
            conn.close();
            return;
        }
        
        members = [...members, conn];
        rooms.set(secret, members);
        
        console.log('Room', chalk.bold('ready'));
        
        send('ready', {}, true);
    }
    
    conn.on('message', function(message) {
        const members = rooms.get(secret);
        
        members.forEach((member) => {
            if (member !== conn) {
                member.send(message);
            }
        });
    });
    
    conn.on('close', function() {
        const members = rooms.get(secret);
        rooms.set(secret, members.filter((member) => member !== conn));
        
        if (members.length < 2) {
            rooms.delete(secret);
            console.log('Room', chalk.bold('closed'));
        }
    });
});

server.listen(9000, () => {
    const shortcut = (process.platform === 'darwin')
        ? 'CMD-C'
        : 'CTRL-C';
        
    console.log('Server is started.');
    console.log(`Press ${chalk.bold(shortcut)} to stop.`);
});

process.on('SIGINT', () => {
    if (rooms.size) {
        console.log('open rooms:\n', [...rooms.keys()].join('\n'))
    }
    process.exit(1);
});