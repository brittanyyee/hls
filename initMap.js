var map;
let circles = [];
let markers = [];

let bounds = null;
let geoLat = 30;
let geoLng = 0;
let markerCluster = null;

let us_states_data = getProvincesForCountry('us');



function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
}




function initMap(position) {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 39.820423,
      lng: -102.017371
    },
    zoom: 3,
    minZoom: 2,
    disableDefaultUI: true,
    mapId: '4938a8bb981d96d0',
  });
  bounds = map.getBounds();
 

  $.getJSON('topo-sm.json', function (data) {
    let geoJsonObject = topojson.feature(data, data.objects["custom.geo"]);
    map.data.addGeoJson(geoJsonObject, {
      'idPropertyName': 'iso_a2'
    });

    country_data.forEach(function (country) {
      var feature = map.data.getFeatureById(country.country_code);
      if (feature) {
        feature.setProperty('name', country.country_name);
        feature.setProperty('url', country.image_url);
        feature.setProperty('confirmed', country.confirmed);
        feature.setProperty('c_velocity', country.velocity_confirmed);
        feature.setProperty('dead', country.dead);
        feature.setProperty('d_velocity', country.velocity_dead);
        feature.setProperty('recovered', country.recovered);
        feature.setProperty('r_velocity', country.velocity_recovered);
        feature.setProperty('population', country.population);
        feature.setProperty('updated', country.updated);
      }
    });

    var loaded = parseInt(document.getElementById("mapLoadStatus").innerHTML);
    document.getElementById("mapLoadStatus").innerHTML = loaded + 1;
  });

  $.getJSON('topo-us-states-sm.json', function (data) {
    var geoJsonObject = topojson.feature(data, data.objects["us.states.geo"]);
    map.data.addGeoJson(geoJsonObject, {
      'idPropertyName': 'admin'
    });

    us.states.data.forEach(function (state) {
      var feature = map.data.getFeatureById(state.province_name);
      if (feature) {
        feature.setProperty('name', state.country_name);
        feature.setProperty('url', state.image_url);
        feature.setProperty('confirmed', state.confirmed);
        feature.setProperty('c_velocity', state.velocity_confirmed);
        feature.setProperty('dead', state.dead);
        feature.setProperty('d_velocity', state.velocity_dead);
        feature.setProperty('recovered', state.recovered);
        feature.setProperty('r_velocity', state.velocity_recovered);
        feature.setProperty('population', state.population);
        feature.setProperty('updated', state.updated);
      }
    });

    var loaded = parseInt(document.getElementById("mapLoadStatus").innerHTML);
    document.getElementById("mapLoadStatus").innerHTML = loaded + 1;
  });

  

}



