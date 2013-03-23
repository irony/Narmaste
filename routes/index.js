/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Närmaste.se' });
};

exports.poi = function(req, res) {
	var request = require('request')
		, url = require('url')
		, url_parts = url.parse(req.url, true)
		, query = url_parts.query;

	request('http://narmaste.se/Map/JsonQuery?q={query}&lng={lng}&lat={lat}'.replace('{query}', query.q).replace('{lng}', query.lng).replace('{lat}', query.lat), function(err, response, body) {
		console.log('query', query);
		if (response.statusCode === 200 && !err) {
			var pois = JSON.parse(body);
			console.log('found', pois.length);
			
			pois = pois.map(function(poi){
				poi.OpenNow = poi.CalculatedOpeningHours && poi.CalculatedOpeningHours.OpenNow;
				poi.OpeningIn = poi.CalculatedOpeningHours && poi.CalculatedOpeningHours.OpeningIn;
				delete poi.CalculatedOpeningHours;
				return poi;
			});
			res.json(pois);
		} else {
			res.send(body, null, response.statusCode);
		}
	});
};

exports.stationInfo = function(req, res) {
	var request = require('request')
		, url = require('url')
		, key = '3806b65f3aa2bb60d8454a94790bfb75'
		, query = req.query;


	request('https://api.trafiklab.se/sl/realtid/GetSite.json?stationSearch={query}&key={key}'.replace('{query}', query.q).replace('{key}', key), function(err, response, body) {
		if (response.statusCode === 200 && !err) {
			var siteResponse = JSON.parse(body);
			var site = siteResponse.Hafas.Sites.Site.length ? siteResponse.Hafas.Sites.Site[0] : siteResponse.Hafas.Sites.Site;
			var siteId = site.Number;

			if (!siteId)
				return res.end(body);
			
			request('https://api.trafiklab.se/sl/realtid/GetDepartures.json?siteId={siteId}&key={key}'.replace('{siteId}', siteId).replace('{key}', key), function(err, response, body) {
				if (response.statusCode === 200 && !err) {
					var departureResponse = JSON.parse(body);

					res.json(departureResponse);
				} else {
					return res.end(body);
				}
			});

		} else {
			return res.end(body);
		}
	});
};
