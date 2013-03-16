/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Närmaste.se' })
};

exports.poi = function(req, res) {
	var request = require('request')
		, url = require('url')
		, url_parts = url.parse(req.url, true)
		, query = url_parts.query;

	request('http://narmaste.se/Map/JsonQuery?q={query}&lng={lng}&lat={lat}'.replace('{query}', query.q).replace('{lng}', query.lng).replace('{lat}', query.lat), function(err, response, body) {
		if (response.statusCode == 200 && !err) {
			res.end(body);
		}
	})


};