var Botkit = require('botkit');
var moment = require('moment');
require('moment-duration-format');

/**
 * Config
 *
 */

if (!process.env.CLIENT_ID ||
    !process.env.CLIENT_SECRET ||
    !process.env.PORT ||
    !process.env.VERIFICATION_TOKEN) {
        console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
        process.exit(1);
}

var config = {};

if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({ mongoUri: process.env.MONGOLAB_URI })
    };
}
else {
    config = {
        json_file_store: './db_slackbutton_slash_command/'
    };
}

var controller = Botkit.slackbot(config).configureSlackApp(
    {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scopes: ['commands']
    }
);

/**
 * Login
 *
 */

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        }
        else {
            res.send('Success!');
        }
    });
});

/**
 * Helpers
 *
 */

// NOTE: unix time is in seconds, duration expects miliseconds

var timeRemain = function(timeStart, timeNow) {
    var timeMandatory = 8 * 60 * 60; // 8 hours in seconds

    return moment.duration((timeStart.unix() + timeMandatory - timeNow.unix()) * 1000 ).format('HH:mm');
};

var timeDuration = function(timeStart, timeNow) {
    return moment.duration((timeNow.unix() - timeStart.unix()) * 1000 ).format('HH:mm');
};

/**
 * Commands
 *
 */

controller.on('slash_command', function (slashCommand, message) {

    // check token match
    if (message.token !== process.env.VERIFICATION_TOKEN) {
        return false;
    }

    // check for `work` command
    if (message.command === '/work') {

        if (message.text === 'start') {
            var timeStart = moment('2017-01-29T11:45:00Z');

            slashCommand.replyPublic(message,
                'Started working time: *' + timeStart.format('dddd, DD.MM.YYYY [at] HH:mm') + '*.\n' +
                'Time to get work done, we need to make some money.'
            );
        }

        else if (message.text === 'status') {
            var timeStart = moment('2017-01-29T11:45:00Z'),
                timeNow = moment();

            // TODO: output proper message if more than 8 hours have passed by
            slashCommand.replyPublic(message,
                'Remaining working time: *' + timeRemain(timeStart, timeNow) + '*.\n' +
                'Oh, the time flies so fast.'
            );
        }

        else if (message.text === 'end') {
            var timeStart = moment('2017-01-29T11:45:00Z'),
                timeNow = moment();

            slashCommand.replyPublic(message,
                'Ended working time: *' + timeNow.format('dddd, DD.MM.YYYY [at] HH:mm') + '*.\n' +
                'Total time: *' + timeDuration(timeStart, timeNow) + '*.\n' +
                'Well, tomorrow is another day. Good job!'
            );
        }

        else {
            slashCommand.replyPublic(message,
                'I\'m afraid I don\'t know how to ' + message.command + ' yet.'
            );
        }

    }
});
