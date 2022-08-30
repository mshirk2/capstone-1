const BASE_URL = "https://www.refugerestrooms.org/api"

// Search input
let CURRENT_LAT;
let CURRENT_LON;
let GEOCODER;
const $geocoderContainer = $('#geocoder-container');
const $searchButton = $('#search-button');
const $useLocation = $('#use-location');

// Search filters
const $isAccessible = $('#accessible');
const $isUnisex = $('#unisex');
const $hasChangingTable = $('#changing-table');

// Search output
let RESTROOM_RESULTS = new Map();
let CURRENT_MARKERS = [];
const NUM_RESULTS = 100;
const $resultsContainer = $('#results-container');
const $listContainer = $('#list-container');
const $resultsList = $('#results-list');
const $mapContainer = $('#map-container');


//////////////////////////////////////////////////////////////////

// Search query Event Handler
$searchButton.on('click', (evt) => {
    evt.preventDefault();
    handleSearchByQuery();
})

// Search Current Location Event Handler
$useLocation.on('click', (evt) => {
    evt.preventDefault();
    handleSearchByLocation();
})

const handleSearchByQuery = async () => {

    // clear previous search results from internal storage, results list, and map
    RESTROOM_RESULTS.clear();
    $resultsList.empty();
    clearMapMarkers();

    // get locations based on query
    const $query = $('#query').val()
    console.log($query);

    await getResultsByQuery($query);
}

const getResultsByQuery = async ($query) => {

    const per_page = NUM_RESULTS;

    resp = axios
        .get(`${BASE_URL}/v1/restrooms/search?page=1&per_page=${per_page}&offset=0&query=${$query}&ada=${$isAccessible.is(':checked')}&unisex=${$isUnisex.is(':checked')}`)
        
        .then(async (resp) => {
            let restrooms = resp.data;
    
            if (!restrooms){
                console.log('no restrooms found')
                return}
            for (let i = 0; i < restrooms.length; i++){
                const restroom = restrooms[i];
        
                const restroomData = {
                    name: restroom.name,
                    lat: restroom.latitude,
                    lon: restroom.longitude,
                };
                
                console.log(restroomData);
                restroom.number = RESTROOM_RESULTS.size + 1;
                RESTROOM_RESULTS.set(restroom.id, restroom);
        
                addMapMarker(restroom);
                addResultToDOM(restroom);
        
                if (RESTROOM_RESULTS.size === NUM_RESULTS){
                    break;
                }
            }
        
            return restrooms
        })
        .catch((err) => {
            console.log(err);
        });
};


const handleSearchByLocation = async () => {

    // clear previous search results from internal storage, results list, and map
    RESTROOM_RESULTS.clear();
    $resultsList.empty();
    clearMapMarkers();

    // get coordinates based on current location
    await setCurrentLocation();

}

const setCurrentLocation = async () => {
    // Default coordinates
    CURRENT_LAT = 39.9543;
    CURRENT_LON = 75.1657;

    if(!navigator.geolocation) {
        console.log('Geolocation is not supported')
        await showMap(CURRENT_LAT, CURRENT_LON);
    } else {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                CURRENT_LAT = position.coords.latitude;
                CURRENT_LON = position.coords.longitude;
                console.log('lat, lon = ', CURRENT_LAT, CURRENT_LON)
                await showMap(CURRENT_LAT, CURRENT_LON);
                await getResultsByLocation(CURRENT_LAT, CURRENT_LON);
                return coords = {
                    lat: CURRENT_LAT,
                    lon: CURRENT_LON,
                };
            }
        );
    }
};


const getResultsByLocation = async (lat, lon) => {

    const per_page = NUM_RESULTS;

    resp = axios
        .get(`${BASE_URL}/v1/restrooms/by_location?page=1&per_page=${per_page}&offset=0&lat=${lat}&lng=${lon}&ada=${$isAccessible.is(':checked')}&unisex=${$isUnisex.is(':checked')}`)
        .then(async (resp) => {
            let restrooms = resp.data;
    
            if (!restrooms){
                console.log('no restrooms found')
                return}
            for (let i = 0; i < restrooms.length; i++){
                const restroom = restrooms[i];
                
                // filter for changing table (can't be filtered through API)
                if ($hasChangingTable.is(':checked') && !restroom.changing_table){
                    continue;
                }

                const restroomData = {
                    name: restroom.name,
                    lat: restroom.latitude,
                    lon: restroom.longitude,
                };
                
                console.log(restroomData);
                restroom.number = RESTROOM_RESULTS.size + 1;
                RESTROOM_RESULTS.set(restroom.id, restroom);
        
                addMapMarker(restroom);
                addResultToDOM(restroom);
        
                if (RESTROOM_RESULTS.size === NUM_RESULTS){
                    break;
                }
            }
        
            return restrooms
        })
        .catch((err) => {
            console.log(err);
        });
};


const addMapMarker = (restroom) => {

}

const clearMapMarkers = () => {
    if (CURRENT_MARKERS) {
        for (let i = CURRENT_MARKERS.length - 1; i >=0; i--){
            CURRENT_MARKERS[i].remove();
        }
    }
}

const addResultToDOM = (restroom) => {
    const {
        number,
        id,
        name,
        street,
        city,
        state,
        distance,
        details,
        accessible,
        unisex,
        changing_table,
        latitude,
        longitude,
    } = restroom; 

    // Make sure distance doesn't throw an error if undefined
    if (distance){
        displayDistance = (distance.toFixed(2) + ' mi')
    } else {
        displayDistance = ''
    }

    let newLi = $(`
    <li class="list-group-item">
        <div class="d-flex justify-content-between">
            <h4>${number}. ${name}</h4>
            <p class="ml-1">${displayDistance}</p>
        </div>
        <p class="mb-0">${street}</p>
        <p class="mb-0">${city}, ${state}</p>
        <div class="row">
            <div class="col my-2">
                ${accessible ? '<i title="Accessible" class="fa-brands fa-accessible-icon fa-2x"></i>' : ''}
                ${unisex ? '<i title="Unisex/Gender Neutral" class="fa-solid fa-transgender fa-2x"></i>' : ''}
                ${changing_table ? '<i title="Changing Table" class="fa-solid fa-baby fa-2x"></i>' : ''}
            </div>
        </div>
    </li>
    `);

    $resultsList.append(newLi);
};

const showMap = async(lat, lon) => {
    $geocoderContainer.empty();

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center:[lon, lat],
        zoom: 10,
    });

    map.on('click', (event) => {
        // If the user clicked on one of your markers, get its information.
        const features = map.queryRenderedFeatures(event.point, {
          layers: ['YOUR_LAYER_NAME'] // replace with your layer name
        });
        if (!features.length) {
          return;
        }
        const feature = features[0];

        const popup = new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
        `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
        )
        .addTo(map);

    });


    let nav = new mapboxgl.NavigationControl();
    Map.addControl(nav, 'top-right');

    GEOCODER = new MapboxGeocoder({
        mapboxgl: mapboxgl,
        zoom: 11,
    });

    document.getElementById('geocoder-container').appendChild(map);
}