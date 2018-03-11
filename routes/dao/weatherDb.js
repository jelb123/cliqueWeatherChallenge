const pg = require('pg');

pg.defaults.ssl = true;
const pgConnectionStr = 'postgres://spscalnntmlunr:21e210b36bc1f45f5ca0a30a981342f0275562e688cf8911d1ae1543d2887902@ec2-50-16-217-122.compute-1.amazonaws.com:5432/d7v7oj5tkc4dfq';

const pool = new pg.Pool({
	connectionString: pgConnectionStr
})

// During phone call
function insertUserWeather(postcode, weatherDescription, temperature, humidity) {
	const insertQuery = `INSERT INTO areaWeather(postcode, weather, weathertemp, weatherhumidity, timestamp) `
		+ `VALUES(($1), ($2), ($3), ($4), CURRENT_TIMESTAMP) RETURNING userId`
	return pool.query(insertQuery, [postcode, weatherDescription, temperature, humidity]).then(result => {
		const userId = result.rows.map(row => Object.assign({}, row))[0].userid;
		return userId;
	})
}

function updateUserRating(rating, userId) {
	const updateQuery = `UPDATE areaWeather SET rating = ($1) WHERE userid = ($2)`
	return pool.query(updateQuery, [rating, userId])
}

function updateUserCommentUrl(recordingUrl, userId) {
	const updateQuery = `UPDATE areaWeather SET commentrecordinglink = ($1) WHERE userid = ($2)`
	return pool.query(updateQuery, [recordingUrl, userId])
}

function updateUserCommentTranscript(transcript, userId) {
	const updateQuery = `UPDATE areaWeather SET comment = ($1) WHERE userid = ($2)`
	return pool.query(updateQuery, [transcript, userId])

}

function updateSessionWeather(postcode, weatherDescription, temperature, humidity, userId) {
	// Update row in database to include postcode and weather details
	const updateQuery = `UPDATE areaWeather SET postcode = ($1), weather = ($2), `
		+ `weathertemp = ($3), weatherhumidity = ($4), timestamp = CURRENT_TIMESTAMP WHERE userid = ($5)`

	return pool.query(updateQuery, [postcode, weatherDescription, temperature, humidity, userId]).then(result => {
		console.log('Updated weather in db')
	})
}

// For front end
function getLast10WeatherRows() {
	const selectQuery = `SELECT timestamp, postcode, weather, weathertemp, weatherhumidity `
	 	+ `FROM areaWeather ORDER BY userId DESC LIMIT 10`;

	return pool.query(selectQuery);
}

function getRatingCount() {
	const selectQuery = `SELECT rating, COUNT(rating) FROM areaWeather `
		+ `WHERE rating IS NOT NULL GROUP BY rating ORDER BY rating`;

	return pool.query(selectQuery);
}

function getUserComment() {
	const selectQuery = `SELECT rating, comment, commentrecordinglink FROM areaWeather `
		+ `WHERE (comment IS NOT NULL OR commentrecordinglink IS NOT NULL) ORDER BY userid`;

	return pool.query(selectQuery);
}




module.exports = {
	insertUserWeather,
	updateUserRating,
	updateUserCommentUrl,
	updateUserCommentTranscript,
	updateSessionWeather,
	getLast10WeatherRows,
	getRatingCount,
	getUserComment
}
