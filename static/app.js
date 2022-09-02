const BASE_URL = "https://www.refugerestrooms.org/api"
const SCREEN_BREAKPOINT = 767;

// Search input
let CURRENT_LON;
let CURRENT_LAT;
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

    if (!GEOCODER.inputString || !GEOCODER.lastSelected){
        alert("Please enter a location to search")
        return
    }
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

    adjustMapDisplay(coords.lon, coords.lat);

    await getResults(coords.lon, coords.lat);

    hideSpinner();

};


const getCoordinates = () => {
    let coords = {
        lon: CURRENT_LON,
        lat: CURRENT_LAT,
    }

    if (GEOCODER.lastSelected){
        let result = JSON.parse(GEOCODER.lastSelected);
        const { coordinates } = result.geometry;
        coords.lon = coordinates[0];
        coords.lat = coordinates[1];
    }

    return coords;
};


const adjustMapDisplay = (lon, lat) => {
// ajusts display so map and list display side by side on larger screens
    if ($(window).width() > SCREEN_BREAKPOINT) {
        if (!($mapContainer).hasClass('split-screen')){
            $mapContainer.addClass('col-md-8 split-screen');
            $map.addClass('split-screen');
        }

        MAP.center = [lon, lat];
    }
};


const getResults = async (lon, lat) => {

    // add 50 extra results, in case changing table is checked (can't be filtered through API)
    const per_page = NUM_RESULTS + 50; 

    resp = axios
        .get(`${BASE_URL}/v1/restrooms/by_location?page=1&per_page=${per_page}&offset=0&lng=${lon}&lat=${lat}&ada=${$isAccessible.is(':checked')}&unisex=${$isUnisex.is(':checked')}`)
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

const showMap = async(lon, lat) => {
    $geocoderDiv.empty();

    MAP = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 12,
      center: [lon, lat],
    });
  
    const nav = new mapboxgl.NavigationControl();
    MAP.addControl(nav, 'top-right');
  
    GEOCODER = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      zoom: 12,
    }).on('result', () => {
        handleSearch();
    });
  
    document.getElementById('geocoder').appendChild(GEOCODER.onAdd(MAP));
  
    if (USE_LOCATION) {
      // Reverse geocode coordinates to get location name, populate search box with name
      const resp = await axios.post('/api/reverse-geocode', { lon, lat });
      const query_string = resp.data.result;
      GEOCODER.query(query_string);
    }

};


const refreshMap = (lon, lat) => {
    $geocoderDiv.empty();
    if (GEOCODER.mapMarker){
        GEOCODER.mapMarker.remove();
    }

    MAP.center = [lon, lat];

    GEOCODER = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        zoom: 12,
    }).on('result', () => {
        handleSearch();
    });

    document.getElementById('geocoder').appendChild(GEOCODER.onAdd(MAP));

    adjustMapDisplay(lon, lat);
};


const addMapMarker = (restroom) => {
    const {
        number,
        name,
        longitude,
        latitude,
        street,
        city,
        state,
        distance,
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
    el.innerText = number;
    el.className = 'marker';

    const newMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates)
        .setPopup(
            new mapboxgl.Popup().setHTML(`
                <p class="popup-title">${name}<span class="font-weight-normal"><i> - ${distance.toFixed(2)} mi</i></span></p>
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
        name,
        street,
        city,
        state,
        distance,
        accessible,
        unisex,
        changing_table,
        comment,
        directions,
        created_at,
        updated_at,
        upvote,
        downvote,
    } = restroom; 
    
    // Make sure distance doesn't throw an error if undefined
    if (distance){
        displayDistance = (distance.toFixed(2) + ' mi')
    } else {
        displayDistance = ''
    }

    // Reformat created_at and updated_at
    short_created_at = created_at.substring(0,10);  short_updated_at = updated_at.substring(0,10);

    let newLi = $(`
    <li class="list-group-item">
        <div class="d-flex justify-content-between">
            <h4>${number}. ${name}</h4>
            <p class="ml-1">${displayDistance}</p>
        </div>
        <p class="mb-0">${street}</p>
        <p class="mb-0">${city}, ${state}</p>
        <div class="row d-flex">
            <div class="col my-2">
                ${accessible ? '<i title="Accessible" class="fa-brands fa-accessible-icon fa-2x"></i>' : ''}
                ${unisex ? '<i title="Unisex/Gender Neutral" class="fa-solid fa-transgender fa-2x"></i>' : ''}
                ${changing_table ? '<i title="Changing Table" class="fa-solid fa-baby fa-2x"></i>' : ''}
            </div>

            <a 
                id="show-details"
                href="#restroom-details${number}" 
                class="col text-dark d-flex justify-content-end align-self-end mb-3" 
                data-bs-toggle="collapse"  
                role="button" 
                aria-expanded="false" aria-controls="restroom-details${number}">
                    <i class="fa-solid fa-arrow-down fa-lg"></i>
            </a>
            <div class="collapse" id="restroom-details${number}">
                <div class="card card-body">
                    <p>Details: ${comment}</p>
                    <p>Directions: ${directions}</p>
                    <p>Updated: ${short_updated_at}</p>
                    <p>Created: ${short_created_at}</p>
                    <p>Upvotes: ${upvote} | Downvotes: ${downvote}</p>
                </div> 
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
    CURRENT_LON = -75.165717;
    CURRENT_LAT = 39.954328;
    USE_LOCATION = false;

    if(!navigator.geolocation) {
        console.log('Geolocation is not supported')
        await showMap(CURRENT_LON, CURRENT_LAT);
    } else {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                CURRENT_LON = position.coords.longitude;
                CURRENT_LAT = position.coords.latitude;
                USE_LOCATION = true;
                await showMap(CURRENT_LON, CURRENT_LAT);
            },
            async () => {
                await showMap(CURRENT_LON, CURRENT_LAT);
            }
        );
    };
};


const initialize = () => {
    setCurrentLocation();
};


$(initialize());