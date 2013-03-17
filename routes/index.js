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
			var pois = JSON.parse(body);
			pois = pois.map(function(poi){
				poi.OpenNow = poi.CalculatedOpeningHours && poi.CalculatedOpeningHours.OpenNow;
				poi.OpeningIn = poi.CalculatedOpeningHours && poi.CalculatedOpeningHours.OpeningIn;
				delete poi.CalculatedOpeningHours;
				return poi;
			});
			res.json(pois);
		}
	});
};

exports.subway = function(req, res) {
		var request = require('request')
		, url = require('url')
		, url_parts = url.parse(req.url, true)
		, query = url_parts.query;

	request('https://api.trafiklab.se/sl/realtid/GetDepartures.json?siteId=9294&key=', function(err, response, body) {
		if (response.statusCode == 200 && !err) {
			res.end(body);
		}
	});
};

