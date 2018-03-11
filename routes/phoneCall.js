const express = require('express');
const router = express.Router();
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const axios = require('axios');
const moment = require('moment-timezone');
const {
	insertUserWeather,
	updateUserRating,
	updateUserCommentUrl,
	updateUserCommentTranscript,
	updateSessionWeather
} = require('./dao/weatherDb');

// Key would be used as environment variables in a real environment
const weatherAPIKey = 'b6ea9b63910f962a37e68e0ce4518449'

router.post('/welcome', function(req, res) {
	res.send(welcomeMessage());
});

router.post('/getWeather', function(req, res) {
    const postcode = getPostcode(req.body);

    if (postcode) {
        getWeatherDetails(postcode).then(result => {
			const weatherResults = { main, weather } = result.data;

			insertUserWeather(postcode, weather[0].description, main.temp, main.humidity).then(userId => {
				res.send(currentWeatherResponse(userId, postcode, weatherResults));
			}).catch(err => {
				console.log(err);
				res.send(errorResponse());
			})
        }).catch(err => {
            if (err.response.status === 404) {
                console.log(err.response.data)
                res.send(invalidPostcodeResponse(req.body));
            } else {
                res.send(weatherErrorResponse());
            }
        })
    } else {
        res.send(invalidPostcodeResponse(req.body));
    }
})

router.post('/feedbackRating', function(req, res) {
	const userId = req.query.userId;
	const rating = req.body.Digits;

	if (rating >= 1 && rating <= 5) {
		updateUserRating(rating, userId).then(result => {
			res.send(ratingResponse(userId));
		}).catch(err => {
			console.log(err);
			res.send(hangupResponse());
		})
	} else {
		res.send(invalidRatingResponse(userId))
	}
})

router.post('/feedbackComment', function(req, res) {
	const userId = req.query.userId;

	updateUserCommentUrl(req.body.RecordingUrl, userId).catch(err => {
		console.log(err)
	})

	// Want it to hang up even if error occured
	res.send(hangupResponse());
})

router.post('/feedbackCommentTranscribeCallback', function(req, res) {
	const userId = req.query.userId;

	updateUserCommentTranscript(req.body.TranscriptionText, userId).catch(err => {
		console.log(err)
	})

	res.send()

})

module.exports = router;

function welcomeMessage() {
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
        // input: 'dtmf',
        input: 'speech dtmf',
        action: '/phoneCall/getWeather',
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
        numDigits: 4
    })
    gather.say('Welcome to quick Weather. For weather details please enter or clearly state your Australian postcode')

    return twiml.toString();
}

function currentWeatherResponse(userId, postcode, { weather, main }) {
    const twiml = new VoiceResponse();
	console.log(userId)

    twiml.say(
        `The current weather forecast for ` +
        postcode.split('').join(' ') +
        ` is ` + weather[0].description + ` with a temperature of ` +
        main.temp + ` degrees celsius and ` + main.humidity +
        `% humidity. Please hold for a short survey.`
    );
    twiml.pause({
        length: 0.5
    });

    const gather = twiml.gather({
        // input: 'dtmf',
        input: 'dtmf',
        action: '/phoneCall/feedbackRating?userId=' + userId,
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
        numDigits: 1
    })
    gather.say('Using your keypad, what would you rate this service on a scale from 1 to 5')

    return twiml.toString();
}

function ratingResponse(userId) {
	const twiml = new VoiceResponse();

	twiml.say('Please leave a short comment about your experience using this service after the beep');
	twiml.record({
		action: '/phoneCall/feedbackComment?userId=' + userId,
		timeout: 3,
		maxLength: 15,
		transcribe: true,
		transcribeCallback: '/phoneCall/feedbackCommentTranscribeCallback?userId=' + userId,
	})

	return twiml.toString();
}

function hangupResponse() {
	const twiml = new VoiceResponse();

	twiml.say('Thank you for using quick weather. Goodbye');
    twiml.hangup();

    return twiml.toString();
}

function weatherErrorResponse() {
	const twiml = new VoiceResponse();

    twiml.say(
        `An error occurred retrieving the weather. Please try again later.`
    );
    return twiml.toString();
}

function errorResponse() {
	const twiml = new VoiceResponse();
	twiml.say('An error occurred. Please try again later');
	twiml.hangup();

	return twiml.toString();
}

function invalidPostcodeResponse({ Digits, SpeechResult }) {
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
        input: 'speech dtmf',
        action: '/phoneCall/getWeather',
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
        numDigits: 4
    });
    gather.say('The postcode ' + (Digits ? Digits.split('').join(' ') : SpeechResult) + ' does not exist. Please enter or clearly state your Australian postcode');
    return twiml.toString();
}

function invalidRatingResponse(userId) {
	const twiml = new VoiceResponse();

	const gather = twiml.gather({
		// input: 'dtmf',
		input: 'dtmf',
		action: '/phoneCall/feedbackRating?userId=' + userId,
		method: 'POST',
		timeout: 5,
		speechTimeout: 'auto',
		numDigits: 1
	});
	gather.say('The rating you have given is invalid. Using your keypad, what would you rate this service on a scale from 1 to 5');

	return twiml.toString();
}

function getWeatherDetails(postcode) {
    return axios({
        method: 'get',
        url: 'http://api.openweathermap.org/data/2.5/weather',
        params: {
            'zip': postcode + ',au',
            'units': 'metric',
            'APPID': weatherAPIKey
        }
    })
}

function getPostcode({ Digits, SpeechResult }) {
    if (Digits) {
        if (Digits > 200 && Digits < 9999) {
            return Digits;
        } else {
            return null;
        }
    } else if (SpeechResult) {
        let postcode = (/^[\d]{3,4}$/.test(SpeechResult.replace('o', '0').trim()) ? SpeechResult.replace('o', '0').trim() : null);

        return postcode;
    } else {
        return null;
    }
}
