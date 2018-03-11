const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const {
	getLast10WeatherRows,
	getRatingCount,
	getUserComment
} = require('./dao/weatherDb');

/* GET home page. */
router.get('/', function(req, res, next) {
	getLast10WeatherRows().then(result => {
		const weatherDetailsObjArr = result.rows.map(row => Object.assign({}, row));

		return Promise.all([getRatingCount(), weatherDetailsObjArr]);
	}).then(([ratingsResult, weatherDetailsObjArr]) => {
		const ratingsObjArr = ratingsResult.rows.map(row => Object.assign({}, row));

		return Promise.all([getUserComment(), weatherDetailsObjArr, ratingsObjArr])
	}).then(([commentsResult, weatherDetailsObjArr, ratingsObjArr]) => {
		const commentsObjArr = commentsResult.rows.map(row => Object.assign({}, row));
		console.log(ratingsObjArr)
		console.log(weatherDetailsObjArr)
		console.log(commentsObjArr)

		res.render('index', {
			title: 'Quick Weather Admin',
			weatherDetailsArr: weatherDetailsObjArr,
			ratingsArr: ratingsObjArr,
			commentsArr: commentsObjArr,
			moment: moment
		});
	}).catch(err => {
		console.error(err);
		res.send(errorResponse());
	});


});

module.exports = router;
