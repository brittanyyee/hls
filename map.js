$('body').on('DOMSubtreeModified', '#mapLoadStatus', function () {
    var load = parseInt(document.getElementById("mapLoadStatus").innerHTML);
    if (load === numToposToLoad) {

        function removeAllCircles() {
            for (const i in circles) {
                circles[i].setMap(null);
                markers[i].setMap(null);
            }
            circles = [];
            markers = [];
        }


        function getCurrentMode() {
            var icon = document.getElementById('modeIcon');
            if (icon.classList.value == "fas fa-sun") {
                return 'dark';
            } else {
                return 'light';
            }
        }

        map.data.setStyle((feature) => {
            let strokeWeight = 0.5;

            let currentMode = getCurrentMode();

            let strokeColor = '#4d5659';

            if (currentMode === 'light') {
                strokeColor = '#c9b2a6';
            }

            if (feature.getProperty('state') === 'hover') {
                strokeWeight = 1;
                strokeColor = 'rgb(154,154,154)'
            }


            if (feature.getProperty('geotype') === "country") {
                zIndex = 2;
            } else {
                zIndex = 1;
            }

            return {
                strokeWeight: strokeWeight,
                strokeColor: strokeColor,
                fillColor: 'rgba(0,0,0,0)',
                zIndex: zIndex
            }
        });

        document.getElementById('changeMode').addEventListener('click', function () {
            var icon = document.getElementById('modeIcon');
            if (icon.classList.value == "fas fa-sun") {
                icon.classList = "fas fa-moon";
                map.setOptions({
                    mapId: styles['light']
                });
                document.cookie = 'theme=light';
                document.getElementById('changeMode').style.backgroundColor = "#546bab";

            } else {
                icon.classList = "fas fa-sun";
                map.setOptions({
                    mapId: styles['dark']
                });
                document.cookie = 'theme=dark';
                document.getElementById('changeMode').style.backgroundColor = "#fcb103";
                document.getElementById('toDead').style.backgroundColor = "aqua !important";
            }
            map.data.revertStyle();
            setMapColors();

            location.reload();

        });

        let refineLevel = 100;
        let all_province_data = [us_states_data, ca_province_data, br_province_data, de_province_data, fr_province_data];
        let province_topo_codes = ['us', 'ca', 'br', 'de', 'fr', 'in'];


        let conf_colors = ['#ff4444', '#fe4442', '#fe4341', '#fd433f', '#fd423e', '#fc423c', '#fc413b', '#fb413a', '#fb4038', '#fa4037', '#fa3f35', '#f93f34', '#f93e33', '#f83d31', '#f83d30', '#f83c2f', '#f73b2d', '#f73a2c', '#f6392a', '#f63929', '#f63828', '#f53727', '#f53625', '#f43524', '#f43423', '#f43322', '#f43220', '#f3311f', '#f3301e', '#f32f1c', '#f22d1b', '#f22c1a', '#f22b18', '#f12a17', '#f12816', '#f12714', '#f12513', '#f02412', '#f02210', '#f0200f', '#f01e0d', '#ef1c0c', '#ef1a0a', '#ef1708', '#ef1507', '#ef1205', '#ee0e04', '#ee0a03', '#ee0501', '#ee0000']

        // palette =
        let rec_colors = ['#aaffaa', '#a8fda7', '#a5fba4', '#a3faa1', '#a0f89e', '#9ef69b', '#9bf498', '#99f395', '#96f192', '#94ef8f', '#91ed8c', '#8fec89', '#8cea86', '#89e883', '#87e681', '#84e57e', '#82e37b', '#7fe178', '#7cdf75', '#7ade72', '#77dc6f', '#74da6c', '#72d969', '#6fd766', '#6cd563', '#6ad360', '#67d25d', '#64d05a', '#61ce57', '#5ecc54', '#5bcb51', '#58c94e', '#55c74a', '#52c547', '#4fc444', '#4cc241', '#49c03e', '#45bf3a', '#42bd37', '#3ebb34', '#3ab930', '#36b82c', '#32b628', '#2eb424', '#29b320', '#24b11c', '#1eaf16', '#17ad10', '#0dac08', '#00aa00'];

        // palette =
        let dead_colors = ['#f1eef5', '#efeaf3', '#eee5f1', '#ece1ee', '#eadcec', '#e9d8ea', '#e8d4e7', '#e7cfe5', '#e6cae3', '#e5c6e0', '#e4c1de', '#e3bcdb', '#e2b8d9', '#e2b3d6', '#e1aed4', '#e1a9d1', '#e0a4ce', '#e09fcc', '#e09ac9', '#e095c7', '#df8fc4', '#df8ac1', '#df84be', '#df7fbc', '#df79b9', '#df73b6', '#df6cb3', '#df66b0', '#df60aa', '#df5aa4', '#de549e', '#dc4e97', '#db4992', '#d8448c', '#d63e87', '#d33981', '#d0347c', '#cd2f77', '#c92b72', '#c6266d', '#c22268', '#be1d64', '#ba195f', '#b5155b', '#b11057', '#ac0c53', '#a8084f', '#a3054b', '#9e0247', '#990043']


        function getCountryByCode(code) {
            return country_data.filter(
                function (data) {
                    return data.country_code === code
                }
            )[0];
        }

        // set refinement to 100 initially
        refine(refineLevel);

        var input = document.getElementById('pac-input');
        var autocomplete = new google.maps.places.Autocomplete(input, {types: ['(regions)']});
        autocomplete.bindTo('bounds', map);
        autocomplete.setFields(['geometry']);

        map.addListener('idle', function () {
            if (refineLevel >= 75) {
                bounds = map.getBounds();
                for (var i = 0; i < markers.length; i++) {
                    if (bounds.contains(markers[i].position)) {
                        circles[i].setVisible(true);
                        markers[i].setVisible(true);
                    } else {
                        circles[i].setVisible(false);
                        markers[i].setVisible(false);
                    }
                }
            }
        });

        autocomplete.addListener('place_changed', () => {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                return;
            }
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
                map.setZoom(6);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(8);
            }
        });

        // refinement slider code
        function refine(level) {
            // set global tracker up to date
            refineLevel = level;

            // COUNTRY LEVEL TOGGLE (threshold = 30)
            if (level >= 30) {
                // disable country level interaction
                for (let i = 0; i < province_topo_codes.length; i++) {
                    let feature = map.data.getFeatureById(province_topo_codes[i]);
                    map.data.overrideStyle(feature, {
                        clickable: false,
                        visible: false
                    });
                }
                // enable state/province level coloring
                for (let j = 0; j < all_province_data.length; j++) {
                    all_province_data[j].forEach(function (state) {
                        var feature = map.data.getFeatureById(state.province_name);
                        map.data.overrideStyle(feature, {
                            visible: true
                        });
                    })
                }

            } else {
                // enable country level coloring and clicking
                for (let i = 0; i < province_topo_codes.length; i++) {
                    let feature = map.data.getFeatureById(province_topo_codes[i]);
                    map.data.overrideStyle(feature, {
                        clickable: true,
                        visible: true
                    });
                }

                // disbale state/province level coloring
                for (let j = 0; j < all_province_data.length; j++) {
                    all_province_data[j].forEach(function (state) {
                        var feature = map.data.getFeatureById(state.province_name);
                        map.data.overrideStyle(feature, {
                            visible: false
                        });
                    })
                }
            }

            // int level in [0,100]
            // CITY LEVEL TOGGLE (threshold = 75)
            if (level >= 75) {
                turn_on_circles();

            } else {
                turn_off_circles();
            }


            setMapColors();
        }


        function getMapColoring(num, mode) {
            let color, idx, op;
            num += 1

            if (mode == 'confirmed') {
                idx = Math.floor((conf_colors.length - 1) * (Math.min(Math.log10(num) / 5, 1)));
                op = Math.floor(255 * (Math.min(Math.log10(num) / 5, 1))).toString(16);
                if (op.length == 1) {
                    op = '0' + op;
                }
                color = conf_colors[idx] + op;
            } else if (mode == 'dead') {
                idx = Math.floor((dead_colors.length - 1) * (Math.min(Math.log10(num) / 5, 1)));
                op = Math.floor(255 * (Math.min(Math.log10(num) / 5, 1))).toString(16);
                if (op.length == 1) {
                    op = '0' + op;
                }
                color = dead_colors[idx] + op;
            } else if (mode == 'recovered') {
                idx = Math.floor((rec_colors.length - 1) * (Math.min(Math.log10(num) / 5, 1)));
                op = Math.floor(255 * (Math.min(Math.log10(num) / 5, 1))).toString(16);
                if (op.length == 1) {
                    op = '0' + op;
                }
                color = rec_colors[idx] + op;
            }
            return color;
        }

        function setCountryMapColors(dataset, country_name) {
            var reset = false;

            dataset.forEach(function (elem) {

                let feature = map.data.getFeatureById(elem.province_name);
                let mapMode = document.getElementById("currentMapMode").textContent;
                let color = "rgba(200, 54, 54, 0)";

                if (mapMode === 'confirmed') {
                    reset = true;
                    color = getMapColoring(elem.confirmed | 0, 'confirmed');
                } else if (mapMode === 'recovered') {
                    if (elem.recovered === null) {
                        color = "rgba(200, 54, 54, 0)";
                    } else {
                        reset = true;
                        color = getMapColoring(elem.confirmed | 0, 'recovered');
                    }
                } else if (mapMode === 'dead') {
                    if (elem.dead === null) {
                        color = "rgba(200, 54, 54, 0)";
                    } else {
                        reset = true;
                        color = getMapColoring(elem.confirmed | 0, 'dead');
                    }
                }

                map.data.overrideStyle(feature, {
                    fillColor: color
                });
            })

            if (reset) {
                var country_feature = map.data.getFeatureById(country_name);
                map.data.overrideStyle(country_feature, {
                    visible: false
                });
            }
        }

        function setMapColors() {

            country_data.forEach(function (elem) {
                let feature = map.data.getFeatureById(elem.country_code);
                let mapMode = document.getElementById("currentMapMode").textContent;
                let color = "rgba(200, 54, 54, 0)";
                if (mapMode == 'confirmed') {
                    reset = true;
                    color = getMapColoring(elem.confirmed | 0, 'confirmed');
                } else if (mapMode == 'recovered') {
                    if (elem.recovered === null) {
                        color = "rgba(200, 54, 54, 0)";
                    } else {
                        reset = true;
                        color = getMapColoring(elem.confirmed | 0, 'recovered');
                    }
                } else if (mapMode == 'dead') {
                    if (elem.dead === null) {
                        color = "rgba(200, 54, 54, 0)";
                    } else {
                        reset = true;
                        color = getMapColoring(elem.confirmed | 0, 'dead');
                    }
                }
                map.data.overrideStyle(feature, {
                    fillColor: color
                });
            });

            // color province level topos if passes threshold
            if (refineLevel >= 30) {
                setCountryMapColors(us_states_data, "us");
                setCountryMapColors(ca_province_data, "ca");
                setCountryMapColors(br_province_data, "br");
                setCountryMapColors(de_province_data, "de");
                setCountryMapColors(fr_province_data, "fr");
                setCountryMapColors(in_province_data, "in");
            }

        }

        setMapColors();

        map.addListener('click', function (e) {
            if (e.feature == undefined) {
                mapInfoWindowOFF();
                map.data.revertStyle();
                setMapColors();
                document.getElementById('sidebar').classList.remove('active');
            }
        });

        map.data.addListener('mouseover', (event) => {
            event.feature.setProperty('state', 'hover');
        });

        map.data.addListener('mouseout', (event) => {
            event.feature.setProperty('state', 'normal');
        });

        function mapInfoWindowOFF() {
            document.getElementById('sidebar').classList.remove('active');
        }

        function cityMapInfoWindow(name, url, ) {

        }

        function mapInfoWindow(name, url, confirmed, c_velocity, dead, d_velocity, recovered, r_velocity, population, updated) {
            if(document.getElementById('legend').style.display == ''){
                document.getElementById('sidebar').classList.remove('active')
            }

            document.getElementById("infoCountryLegend").innerHTML =
                `${name}&nbsp;&nbsp; <img src="${url}"  style="max-width:30px; height:auto;" onerror="this.style.display='none'" onwidth="20"/>`;
            document.getElementById("infoUpdatedLegend").innerText = timeSince(new Date(updated));

            // confirmed
            if (c_velocity > 1) {
                document.getElementById("infoConfirmedLegend").innerHTML = formatNumber(confirmed) + "<i class='fas fa-sort-up fa-xs' style='border: 0; color: rgb(214, 102, 121)'></i>";
            } else {
                document.getElementById("infoConfirmedLegend").innerHTML = formatNumber(confirmed);
            }

            // dead
            if (dead !== null) {
                document.getElementById("infoDeadLegend").innerHTML = formatNumber(dead);
            } else {
                document.getElementById("infoDeadLegend").innerHTML = 'N/A';
            }

            // recovered
            if (recovered !== null) {
                document.getElementById("infoRecoveredLegend").innerHTML = formatNumber(recovered);
            } else {
                document.getElementById("infoRecoveredLegend").innerHTML = 'N/A';
            }

            let active_vel = c_velocity;
            let dead_vel = d_velocity;
            let rec_vel = r_velocity;
            if(d_velocity != null) {
                active_vel -= d_velocity;
            } else {
                dead_vel = 0;
            }
            if(r_velocity != null) {
                active_vel -= r_velocity;
            } else {
                rec_vel = 0;
            }


            document.getElementById('velAct').innerHTML = '<i data-feather="trending-up"></i>&nbsp; ' + Math.max(active_vel, 0).toLocaleString();
            document.getElementById('velDead').innerHTML = '<i data-feather="trending-up"></i>&nbsp; ' + Math.max(dead_vel, 0).toLocaleString();
            document.getElementById('velRec').innerHTML = '<i data-feather="trending-up"></i>&nbsp; ' + Math.max(rec_vel, 0).toLocaleString();
            feather.replace();

            // active
            if (recovered === null) {
                recovered = 0;
            }
            if (dead === null) {
                dead = 0;
            }
            document.getElementById("infoActiveLegend").innerHTML = formatNumber(confirmed - dead - recovered);

            // line percentages
            if (confirmed > 0) {
                document.getElementById("activePercentLegend").innerHTML = 95 * ((confirmed - dead - recovered) / confirmed) + "%";
                document.getElementById("deadPercentLegend").innerHTML = 95 * (dead / confirmed) + "%";
                document.getElementById("recPercentLegend").innerHTML = 95 * (recovered / confirmed) + "%";

                document.getElementById("actSVGLegend").style.strokeDasharray = 100 * ((confirmed - dead - recovered) / confirmed) + ", 100";
                document.getElementById("dedSVGLegend").style.strokeDasharray = 100 * ((dead) / confirmed) + ", 100";
                document.getElementById("recSVGLegend").style.strokeDasharray = 100 * ((recovered) / confirmed) + ", 100";
            } else {
                document.getElementById("activePercentLegend").innerHTML = "0%";
                document.getElementById("deadPercentLegend").innerHTML = "0%";
                document.getElementById("recPercentLegend").innerHTML = "0%";

                document.getElementById("actSVGLegend").style.strokeDasharray = "0, 100";
                document.getElementById("dedSVGLegend").style.strokeDasharray = "0, 100";
                document.getElementById("recSVGLegend").style.strokeDasharray = "0, 100";
            }



            // population AND graph AND cities
            if (population != null && population != 0) {
                document.getElementById("infoPopLegend").innerHTML = (100 * (confirmed / population)).toFixed(3) + "%";
                document.getElementById("populationRowLegend").style.display = '';

                if(name == "Russian Federation") {
                    name = "Russia";
                }

                // turn  on graph
                document.getElementById("timeSeriesSVGContainer").style.display = '';
                if(region_numbers[name] != null){
                    generateGraphGivenNumbers(region_numbers[name], 'timeSeriesSVG', {outlineColor: '#ffffff00', backgroundColor: '#22282a', graphColor: '#d66679', 'graphStroke': 'white'});
                }
                
                // top cities
                if(top_cities[name]){
                    document.getElementById("citiesRowLegend").style.display = '';
                    citiesList = document.getElementById("citiesListLegend");
                    citiesList.innerHTML = '';
                    let obj = JSON.parse(top_cities[name]);
                    
                    for(let i=0; i < obj.length; i++){
                        let node = document.createElement("LI"); 
                        node.classList = 'topcity';
                        node.innerHTML = "<a style='margin-left:10px; font-weight: 700;'>" + 
                                        obj[i].fields.city_name + "</a>  <br>" + 
                                        "<a class='numbers' style='color:tan; font-size: medium !important; position: absolute; left: 20px;'>" + 
                                        formatNumber(obj[i].fields.confirmed) + "</a>" + 
                                        "<a class='numbers' style='color:rgb(214, 102, 121); font-size: medium !important; position: absolute; left: 45%;'>" + 
                                        formatNumber(obj[i].fields.dead) + "</a>" + 
                                        "<a class='numbers' style='color:rgb(113, 255, 47); font-size: medium !important; position: absolute; right: 30px;'>" + 
                                        formatNumber(obj[i].fields.recovered) + "</a>";
                        node.onclick=function(){
                            map.setZoom(6);
                            map.panTo({lat:obj[i].fields.lat,lng:obj[i].fields.long});
                        };
                        citiesList.appendChild(node);
                    }
                    
                } else {
                    document.getElementById("citiesRowLegend").style.display = 'none';
                }
                

            } else {
                document.getElementById("citiesRowLegend").style.display = 'none';
                document.getElementById("populationRowLegend").style.display = 'none';
                document.getElementById("timeSeriesSVGContainer").style.display = 'none';
            }


            // expand sidebar
            document.getElementById('sidebar').classList.add('active');
            document.getElementById("iwLegend").style.display = '';
            document.getElementById("legend").style.display = 'none';


            $('.value').each(function () {
                var text = $(this).text();
                $(this).parent().css('width', text);
            });
        }

        function truncate(str) {
            if(str.length > 10){
                return str.substring(0,10) + '...';
            } else {
                return str;
            }
        }
        function formatNumber(num) {
            if(num == null){
                return 'N/A';
            }
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        }

        function timeSince(date) {
            let seconds = Math.floor((new Date() - date) / 1000);
            let interval = Math.floor(seconds / 31536000);
            if (interval > 1) {
                return `Updated ${interval} years ago`;
            }
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) {
                return `Updated ${interval} months ago`;
            }
            interval = Math.floor(seconds / 86400);
            if (interval > 1) {
                return `Updated ${interval} days ago`;
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 1) {
                return `Updated ${interval} hours ago`;
            }
            interval = Math.floor(seconds / 60);
            if (interval > 1) {
                return `Updated ${interval} minutes ago`;
            }
            return `Updated ${Math.floor(seconds)} seconds ago`;
        }

        function createCircle(args) {
            var marker = new google.maps.Marker({
                position: {
                    lat: args['lat'],
                    lng: args['lng']
                },
                opacity: 0,
                visible: false,
                clickable: false,
            });

            // draw cities and countries
            var mult = 9500;
            var circleOption = {
                center: {
                    lat: args['lat'],
                    lng: args['lng']
                },
                strokeColor: args['color'],
                strokeOpacity: 0,
                strokeWeight: 2,
                fillColor: args['color'],
                fillOpacity: 0.6,
                map: map,
                radius: Math.min(Math.max(Math.log(args['data']) * mult, 3.5 * mult), 100 * mult),
                zIndex: 10,
            };
            var circle = new google.maps.Circle(circleOption);
            circle.bindTo('center', marker, 'position');
            circle.bindTo('map', marker, 'map');

            circles.push(circle);
            markers.push(marker);

            var _radius_initial = circleOption.radius;
            var _radius_current = circleOption.radius;

            google.maps.event.addListener(circle, 'click', function (ev) {
                mapInfoWindow(args['name'], args['url'], args['confirmed'], args['velocity_confirmed'], args['dead'], args['velocity_dead'], args['recovered'], args['velocity_recovered'], null, args['updated']);
            });

            circle.addListener('mouseover', () => {
                circleOption.strokeOpacity = 1;
                circleOption.radius = _radius_current * 1.05;
                circle.setOptions(circleOption);
            });
            circle.addListener('mouseout', () => {
                circleOption.strokeOpacity = 0;
                circleOption.radius = _radius_current / 1.05;
                circle.setOptions(circleOption);
            });
            map.addListener('zoom_changed', () => {
                _radius_current = _radius_initial / ((map.getZoom() - 1.7) ** 1.4);
                circle.setRadius(_radius_current);
            });
        }

        function drawNewDataType(mode) {
            document.getElementById("currentMapMode").textContent = mode;

            // reset cluster layer
            markerCluster.clearMarkers();

            // reset map colors
            setMapColors();

            // reset circles
            redrawCircles();
        }
    

        async function redrawCircles() {
            removeAllCircles();
            let mode = document.getElementById("currentMapMode").textContent
            let params = {};

            bounds = map.getBounds();

            if (mode === 'confirmed') {
                document.getElementById("toConfirmed").classList = "menu-item glow-circle activeMap";
                document.getElementById("toDead").classList = "menu-item";
                document.getElementById("toRecovered").classList = "menu-item";

                city_data.forEach(function (city) {
                    if (city.confirmed > 0) {
                        var country = getCountryByCode(city.country_id)
                        // if velocity > 8, draw pulse
                        params = {
                            'lat': city.lat,
                            'lng': city.long,
                            'name': city.city_name,
                            'url': country.image_url,
                            'confirmed': city.confirmed,
                            'dead': city.dead,
                            'recovered': city.recovered,
                            'velocity_confirmed': city.velocity_confirmed,
                            'velocity_dead': city.velocity_dead,
                            'velocity_recovered': city.velocity_recovered,
                            'color': '#FF0000',
                            'data': city.confirmed,
                            'updated': city.updated,
                        }

                        createCircle(params);
                    }

                });

            } else if (mode === 'dead') {
                document.getElementById("toConfirmed").classList = "menu-item";
                document.getElementById("toDead").classList = "menu-item glow-circle activeMap";
                document.getElementById("toRecovered").classList = "menu-item";

                city_data.forEach(function (city) {
                    if (city.dead > 0) {
                        // if velocity > 8, draw pulse
                        var country = getCountryByCode(city.country_id)
                        params = {
                            'lat': city.lat,
                            'lng': city.long,
                            'name': city.city_name,
                            'url': country.image_url,
                            'confirmed': city.confirmed,
                            'dead': city.dead,
                            'recovered': city.recovered,
                            'velocity_confirmed': city.velocity_confirmed,
                            'velocity_dead': city.velocity_dead,
                            'velocity_recovered': city.velocity_recovered,
                            'color': '#9c251c',
                            'data': city.confirmed,
                            'updated': city.updated,
                        }

                        createCircle(params);
                    }

                });

            } else if (mode === 'recovered') {
                document.getElementById("toConfirmed").classList = "menu-item";
                document.getElementById("toDead").classList = "menu-item";
                document.getElementById("toRecovered").classList = "menu-item glow-circle activeMap";

                city_data.forEach(function (city) {
                    if (city.recovered > 0) {
                        // if velocity > 8, draw pulse
                        var country = getCountryByCode(city.country_id)
                        params = {
                            'lat': city.lat,
                            'lng': city.long,
                            'name': city.city_name,
                            'url': country.image_url,
                            'confirmed': city.confirmed,
                            'dead': city.dead,
                            'recovered': city.recovered,
                            'velocity_confirmed': city.velocity_confirmed,
                            'velocity_dead': city.velocity_dead,
                            'velocity_recovered': city.velocity_recovered,
                            'color': '#71e12f',
                            'data': city.confirmed,
                            'updated': city.updated,
                        }

                        createCircle(params);
                    }

                });
            }

            markerCluster = new MarkerClusterer(map, markers, {
                zIndex: 11,
                maxZoom: 4,
                styles: [{
                        width: 30,
                        height: 30,
                        className: 'custom-clustericon-1'
                    },
                    {
                        width: 40,
                        height: 40,
                        className: 'custom-clustericon-2'
                    },
                    {
                        width: 50,
                        height: 50,
                        className: 'custom-clustericon-3'
                    }
                ],
                clusterClass: 'custom-clustericon',
                ignoreHidden: true,
            });

            if (refineLevel >= 75) {
                turn_on_circles();
            } else {
                turn_off_circles();
            }
        }

        redrawCircles();

        function centerOnUser() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    map.setCenter(initialLocation);
                    map.setZoom(5);
                });
            }
        }

        // // Set the fill color to red when the feature is clicked.
        map.data.addListener('click', function (event) {
            // remove styles
            map.data.revertStyle();
            setMapColors();

            feature = event.feature;

            if (feature.getProperty('confirmed') !== undefined) {
                mapInfoWindow(
                    feature.getProperty('admin'),
                    feature.getProperty('url'),
                    feature.getProperty('confirmed'),
                    feature.getProperty('c_velocity'),
                    feature.getProperty('dead'),
                    feature.getProperty('d_velocity'),
                    feature.getProperty('recovered'),
                    feature.getProperty('r_velocity'),
                    feature.getProperty('population'),
                    feature.getProperty('updated'),
                );
            } else {
                // using flag of Jersey as placeholder
                mapInfoWindow(feature.getProperty('admin'),
                    'https://www.countryflags.io/' + feature.getProperty('iso_a2') + '/flat/32.png', 0, 0, 0, 0, 0, 0)
            }

            map.data.overrideStyle(feature, {
                fillColor: 'white'
            });
        });

        async function turn_off_circles() {
            for (var i in circles) {
                circles[i].setVisible(false);
                markers[i].setVisible(false);
            }
            if (markerCluster != null) {
                markerCluster.repaint();
            }
        }
        async function turn_on_circles() {
            for (var i in circles) {
                if (bounds.contains(markers[i].position)) {
                    circles[i].setVisible(true);
                    markers[i].setVisible(true);
                } else {
                    circles[i].setVisible(false);
                    markers[i].setVisible(false);
                }
            }
            if (markerCluster != null) {
                markerCluster.repaint();
            }
        }

        // read the range slider value and call refine
        let id = 0;
        var range = $('.input-range');
        range.on('input', function () {
            let local_id = id + 1;
            id++;
            let state = this.value;

            if (state >= 75) {
                document.getElementById('thumb').classList = "range-slider__thumb range-slider__city_thumb";
                document.getElementById("thumbText").textContent = 'Cities';
            } else if (state >= 30) {
                document.getElementById('thumb').classList = "range-slider__thumb range-slider__prov_thumb";
                document.getElementById("thumbText").textContent = 'Provinces';
            } else {
                document.getElementById('thumb').classList = "range-slider__thumb range-slider__country_thumb";
                document.getElementById("thumbText").textContent = 'Countries';
            }

            setTimeout(function () {
                if (local_id != id) {
                    return;
                } else {
                    refine(state);
                }
            }, 300);
        });


        // move facade slide thumb and update all values as needed
        function updateSlider(element) {
            if (element) {
                var parent = element.parentElement;
                var thumb = parent.querySelector('.range-slider__thumb'),
                    bar = parent.querySelector('.range-slider__bar'),
                    pct = element.value * ((parent.clientHeight - thumb.clientHeight) / parent.clientHeight);
                thumb.style.bottom = pct + '%';
                bar.style.height = 'calc(' + pct + '% + ' + thumb.clientHeight / 2 + 'px)';
            }
        }
        (function initAndSetupTheSliders() {
            [].forEach.call(document.getElementsByClassName("refineSliderContainer"), function (el) {
                var inputs = [].slice.call(el.querySelectorAll('.range-slider input'));
                inputs.forEach(function (input) {
                    input.setAttribute('value', '100');
                    updateSlider(input);
                    input.addEventListener('input', function (element) {
                        updateSlider(input);
                    });
                    input.addEventListener('change', function (element) {
                        updateSlider(input);
                    });
                });
            });
        }());


        // map slider popup (covers all cases)
        $(".refineSliderContainer").mouseover(function () {
            $("#thumbText").fadeIn(600);
            $("#thumbText").removeClass('sliderPopupNone');
        });
        $(".refineSliderContainer").mouseout(function () {
            $("#thumbText").fadeOut(600);
            $("#thumbText").delay(600).addClass('sliderPopupNone');
        });
        // mobile
        $('.refineSliderContainer').bind('touchstart', function (e) {
            $("#thumbText").fadeIn(200);
            $("#thumbText").removeClass('sliderPopupNone');
        });
        $('.refineSliderContainer').bind('touchend', function (e) {
            $("#thumbText").fadeOut(600);
            $("#thumbText").delay(600).addClass('sliderPopupNone');
        });
        // web thumb
        $('#thumb').mouseover(function (e) {
            $("#thumbText").fadeIn(200);
            $("#thumbText").removeClass('sliderPopupNone');
        });
        $('#thumb').mouseout(function (e) {
            $("#thumbText").fadeOut(600);
            $("#thumbText").delay(600).addClass('sliderPopupNone');
        })


        document.getElementById("toDead").addEventListener('click', function () {
            drawNewDataType('dead');
        });
        document.getElementById("toConfirmed").addEventListener('click', function () {
            drawNewDataType('confirmed');
        });
        document.getElementById("toRecovered").addEventListener('click', function () {
            drawNewDataType('recovered');
        });
        document.getElementById("linkTOGGLES_circle").addEventListener('click', function () {
            document.getElementById('TOGGLES_circle').classList.toggle('active');
        });
        document.getElementById("openLegend").addEventListener('click', function () {
            if(document.getElementById('sidebar').classList != 'active') {
                document.getElementById('sidebar').classList.add('active');
            } else {
                document.getElementById('sidebar').classList.remove('active');
            }
            document.getElementById("iwLegend").style.display = 'none';
            document.getElementById("legend").style.display = '';
        });
        document.getElementById("dismiss").addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('active');
        });

    }
});


// put all province level data in this array for the slider to function correctly
//Generate an SVG representing a graph with the numbers given in array
function generateGraphGivenNumbers(numArray, SVGID, options) {
    //some pure number values that can be scaled later
    //all this means is a graph of 2.5 : 1 ratio in size
    WIDTH = 275;
    HEIGHT = 100;

    var defaults = {
        title: 'Confirmed Cases Over Time', //the title of the graph (shows up as h1 tag)
        graphType: 'line', //bar or line
        graphColor: '#000000', //the color of the data points / fill color
        backgroundColor: '#FFFFFF', //anything other than the fill of the graph
        outlineColor: '#FF00FF', //the external outline of the graph
        outlineWidth: '1', //width of the outline
        graphStroke: 'white', //the stroke color of the rectangles / points
        width: '250px', //height and width are in CSS terms
        height: '100px',
        
    };
    var settings = Object.assign(defaults, options);
    svg = document.getElementById(SVGID);
    svg.setAttribute("width", WIDTH);
    svg.setAttribute("height", HEIGHT);
    len = numArray.length;

    pointWidth = WIDTH / len;
    highestElement = numArray.reduce(function(a, b) {
        return Math.max(a, b);
    });
    lowestElement = numArray.reduce(function(a, b) {
        return Math.min(a, b);
    });

    document.getElementById("SVGyAxisTop").innerHTML = highestElement;
    document.getElementById("SVGyAxisBottom").innerHTML = lowestElement;
    heightScale = (HEIGHT / highestElement) * 0.9; //Multiply each num by heightScale

    // Instantiate the graph
    svg.innerHTML = '<rect id="svgBackground"></rect>';
    var svgBackground = document.getElementById("svgBackground");
    svgBackground.setAttribute("x", 0);
    svgBackground.setAttribute("y", 0);
    svgBackground.setAttribute("width", WIDTH);
    svgBackground.setAttribute("height", HEIGHT);
    svgBackground.setAttribute("fill", settings.backgroundColor);
    svgBackground.setAttribute("stroke", settings.outlineColor);
    svgBackground.setAttribute("stroke-width", settings.outlineWidth);

    var titleTag = document.getElementById("SVGtitle");
    titleTag.innerHTML = settings.title;

    //Draw rectangles
    if (settings.graphType == 'bar') {
        for (i = 0; i < len; i++) {
            svg.innerHTML += '<rect id="svgRect' + i + '"></rect>'
            thisRect = document.getElementById("svgRect" + i);
            thisRect.setAttribute("x", pointWidth * i);
            thisRect.setAttribute("y", HEIGHT - (numArray[i] * heightScale));
            thisRect.setAttribute("fill", settings.graphColor);
            thisRect.setAttribute("width", pointWidth);
            thisRect.setAttribute("height", numArray[i] * heightScale);
            thisRect.setAttribute("stroke", settings.graphStroke);
            thisRect.setAttribute("stroke-width", "0.25px");
            
            //Set up tooltips
            thisRect.setAttribute("onmousemove", "updateTooltip('" + numArray[i] + "', event)");
            //thisRect.setAttribute("onfocus", "updateTooltip('" + numArray[i] + "', event)");
            thisRect.setAttribute("onmouseleave", 'document.getElementById("svgTooltip").style.visibility = "hidden";');
        }
        //Set up axes
       // xAxis = document.getElementById("SVGxAxis");
    }
    else if(settings.graphType == 'line') {
        //Keep track of all the locations of the circles we draw in later
        circlesSVG = [];
        
        //create the path
        svg.innerHTML += "<path d='' id='linePath'></path>";
        line = document.getElementById("linePath");

        //instantiate the path and set settings
        line.setAttribute("stroke", settings.graphColor);
        line.setAttribute("stroke-width", "1.5px");
        line.setAttribute("fill", "none");
        line.setAttribute("d", line.getAttribute("d") + "M 0 " + (HEIGHT - (numArray[0] * heightScale)) + " ");
        xCoord = 0;
        yCoord = HEIGHT - (numArray[0] * heightScale);
        circlesSVG.push([0, yCoord, numArray[0]]);
        for (i = 1; i < len; i++) {
            currPath = line.getAttribute("d");
            //append a Move command to the absolute location of:
            //pointWidth * i as the X
            //Height (inverted) as the Y
            xCoord = pointWidth * i;
            yCoord = HEIGHT - (numArray[i] * heightScale);
            circlesSVG.push([xCoord, yCoord, numArray[i]]);
            line.setAttribute("d", currPath + "L " + xCoord + " " + yCoord + " ");
        }

        for (i = 0; i < circlesSVG.length; i++) {
            svg.innerHTML += '<circle id="svgCircle' + i + '"></circle>'
            thisCircle = document.getElementById("svgCircle" + i);
            thisCircle.setAttribute("cx", pointWidth * i);
            thisCircle.setAttribute("cy", HEIGHT - (numArray[i] * heightScale));
            thisCircle.setAttribute("r", 1.5);
            thisCircle.setAttribute("fill", settings.graphColor);
            thisCircle.setAttribute("stroke", settings.graphStroke);
            thisCircle.setAttribute("stroke-width", "0.25px");
            
            //Set up tooltips
            thisCircle.setAttribute("onmousemove", "updateTooltip('" + circlesSVG[i][2] + "', event)");
            //thisCircle.setAttribute("onfocus", "updateTooltip('" + numArray[i] + "', event)");
            thisCircle.setAttribute("onmouseleave", 'document.getElementById("svgTooltip").style.visibility = "hidden";');
            
        }
    }
}

function updateTooltip(value, event) {
    svgTooltip = document.getElementById("svgTooltip");
    svgTooltip.style.visibility = "visible";
    svgTooltip.innerHTML = value;
    var x = event.clientX,
        y = event.clientY;
    svgTooltip.style.top = (y + 21) + 'px';
    svgTooltip.style.left = (x + 1) + 'px';
}