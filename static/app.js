const BASE_URL = "https://www.refugerestrooms.org/api"

// Search input
let CURRENT_LAT;
let CURRENT_LON;
let USE_LOCATION;
let GEOCODER;
const $geocoderDiv = $('#geocoder');
const $searchButton = $('#search-button');

// Search filters
const $isAccessible = $('#accessible');
const $isUnisex = $('#unisex');
const $hasChangingTable = $('#changing-table');

// Search results
let RESTROOM_RESULTS = new Map();
let CURRENT_MARKERS = [];
let MAP;
const NUM_RESULTS = 10;
const $resultsContainer = $('#results-container');
const $listContainer = $('#list-container');
const $resultsList = $('#results-list');
const $mapContainer = $('#map-container');
const $map = $('#map');


/////////////////////////////////////////////////
// Search Event Handler

$searchButton.on('click', (evt) => {
    evt.preventDefault();
    handleSearch();
});


const handleSearch = async () => {

    showSpinner();

    // clear previous search results from results list, internal storage and map
    $resultsList.empty();
    RESTROOM_RESULTS.clear();
    clearMapMarkers();

    // get coordinates based on current or default location
    const coords = getCoordinates();

    adjustMapForDeviceSize(coords.lat, coords.lon);

    await getResults(coords.lat, coords.lon);

    hideSpinner();

};


const getCoordinates = () => {
    return coordinates = {
        lat: CURRENT_LAT,
        lon: CURRENT_LON,
    }
};


const adjustMapForDeviceSize = (lat, lon) => {
// ajusts display so map and list display side by side on larger screens
    if ($(window).width() > 750) {
        if (!($mapContainer).hasClass('map-large')){
            $mapContainer.addClass('col-md-8 map-large');
            $map.addClass('map-large');
        }

        MAP.center = [lon, lat];
    }
};


const getResults = async (lat, lon) => {

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

/////////////////////////////////////////////////
// Map Functions

const showMap = async(lat, lon) => {
    $geocoderDiv.empty();

    MAP = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 13,
      center: [lon, lat],
    });
  
    let nav = new mapboxgl.NavigationControl();
    MAP.addControl(nav, 'top-right');
  
    GEOCODER = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      zoom: 13,
    });
  
    document.getElementById('geocoder').appendChild(GEOCODER.onAdd(MAP));
  
    if (USE_LOCATION) {
      // search using reverse geocode query string
      const resp = await axios.post('/api/reverse-geocode', { lat, lon });
      const query_string = resp.data.result;
      GEOCODER.query(query_string);
    }

};


const refreshMap = (lat, lon) => {
    $geocoderDiv.empty();
    if (GEOCODER.mapMarker){
        GEOCODER.mapMarker.remove();
    }

    MAP.center = [lon, lat];

    GEOCODER = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        zoom: 13,
    });

    document.getElementById('geocoder').appendChild(GEOCODER.onAdd(MAP));

    adjustMapForDeviceSize(lat, lon);
};


const addMapMarker = (restroom) => {
    const {
        number,
        id,
        name,
        longitude,
        latitude,
        street,
        city,
        state,
        distance,
        details,
        accessible,
        unisex,
        changing_table,
      } = restroom;

    const marker = {
        type: 'Feature',
        properties: {
            message: name,
        },
        geometry: {
            type:'Point',
            coordinates: [longitude, latitude],
        },
    };
    
    const el = document.createElement('div');
    el.className = 'marker';
    el.innerText = number;

    const newMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates)
        .setPopup(
            new mapboxgl.Popup().setHTML(`
                <p class="popup-title">${name}<span class="float-right font-weight-normal ml-5"><i>   ${distance.toFixed(2)} mi</i></span></p>
                <p class="popup-address">${street}</p>
                <p class="popup-address">${city}, ${state}</p>
            `)
        )
        .addTo(MAP);
    CURRENT_MARKERS.push(newMarker);
};


const clearMapMarkers = () => {
    if (CURRENT_MARKERS) {
        for (let i = CURRENT_MARKERS.length - 1; i >=0; i--){
            CURRENT_MARKERS[i].remove();
        }
    }
};

/////////////////////////////////////////////////
// Results List

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

/////////////////////////////////////////////////
// Loading Spinner

const showSpinner = () => {
// search button becomes loading spinner
    ($searchButton).attr("data-original-text", $($searchButton).html());
    ($searchButton).prop("disabled", true);
    ($searchButton).html('<i class="spinner-border spinner-border-sm"></i> Loading...');
};


const hideSpinner = () => {
    ($searchButton).prop("disabled", false);
    ($searchButton).html(($searchButton).attr("data-original-text"));
};


/////////////////////////////////////////////////
// Initialize and get current location

const setCurrentLocation = async () => {
    // Default coordinates
    CURRENT_LAT = 39.954328;
    CURRENT_LON = -75.165717;
    USE_LOCATION = false;

    if(!navigator.geolocation) {
        console.log('Geolocation is not supported')
        await showMap(CURRENT_LAT, CURRENT_LON);
    } else {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                CURRENT_LAT = position.coords.latitude;
                CURRENT_LON = position.coords.longitude;
                USE_LOCATION = true;
                console.log('lat, lon = ', CURRENT_LAT, CURRENT_LON)
                await showMap(CURRENT_LAT, CURRENT_LON);
            },
            async () => {
                await showMap(CURRENT_LAT, CURRENT_LON);
            }
        );
    };
};


const initialize = () => {
    setCurrentLocation();
};


$(initialize());