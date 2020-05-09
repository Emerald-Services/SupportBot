//  ____                               _   ____        _   
// / ___| _   _ _ __  _ __   ___  _ __| |_| __ )  ___ | |_ 
// \___ \| | | | '_ \| '_ \ / _ \| '__| __|  _ \ / _ \| __|
//  ___) | |_| | |_) | |_) | (_) | |  | |_| |_) | (_) | |_ 
// |____/ \__,_| .__/| .__/ \___/|_|   \__|____/ \___/ \__|
//             |_|   |_|                           
//              © 2020 Created by Emerald Services
//              Licnese: MIT
//              SupportBot v6.0



new (require('./structures/Extends'))();

const SupportClient = require("./structures/SupportClient");
const config = require('./supportbot-config.js');


const client = new SupportClient({
    messageCacheMaxSize: 100,
    messageCacheLifetime: 3600,
    messageSweepInterval: 7200,
    disableEveryone: true
});

   
client.login(config.Token);