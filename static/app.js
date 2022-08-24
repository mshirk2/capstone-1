const BASE_URL = "https://www.refugerestrooms.org/api"

// Search input
let CURRENT_LAT;
let CURRENT_LON;
let GEOCODER;
const $geocoderContainer = $('#geocoder-container');
const $searchButton = $('#search-button');
const $useLocation = $('#use-location');

// Search filters
const $isAccessible = $('#accessible')
const $isUnisex = $('#unisex')
const $hasChangingTable = $('#changing-table')

// Search output
let RESTROOM_RESULTS = new Map();
let CURRENT_MARKERS = [];
const NUM_RESULTS = 15;
const $resultsContainer = $('#results-container');
const $listContainer = $('#list-container');
const $resultsList = $('#results-list');
const $mapContainer = $('#map-container');


//////////////////////////////////////////////////////////////////

// Search button Event Handler
$searchButton.on('click', (evt) => {
    evt.preventDefault();

    handleSearch();
})

// Use Current Location Event Handler
$useLocation.on('click', (evt) => {
    evt.preventDefault();
    handleSearch();
})


const handleSearch = async () => {

    // clear previous search results from internal storage, results list, and map
    RESTROOM_RESULTS.clear();
    $resultsList.empty();
    clearMapMarkers();

    // get coordinates based on search input
    const coordinates = await setCurrentLocation();
    console.log('Coordinates =', coordinates);

    // await getResults(coordinates.lat, coordinates.lon);

}


const setCurrentLocation = async () => {
    // Default coordinates
    CURRENT_LAT = 39.9543;
    CURRENT_LON = 75.1657;

    if(!navigator.geolocation) {
        console.log('Geolocation is not supported')
        await initializeMap(CURRENT_LAT, CURRENT_LON);
    } else {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                CURRENT_LAT = position.coords.latitude;
                CURRENT_LON = position.coords.longitude;
                console.log('lat, lon = ', CURRENT_LAT, CURRENT_LON)
                await getResults(CURRENT_LAT, CURRENT_LON);
                return coords = {
                    lat: CURRENT_LAT,
                    lon: CURRENT_LON,
                };
            }
        );
    }
};


const getResults = async (lat, lon) => {

    const per_page = NUM_RESULTS;

    resp = axios
        .get(`${BASE_URL}/v1/restrooms/by_location?page=1&per_page=${per_page}&offset=0&lat=${lat}&lng=${lon}`)
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
        list_number,
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

    let newLi = $(`
    <li class="list-group-item">
        <h4>${name}</h4>
        <p class="mb-0">${street}</p>
        <p class="mb-0">${city}, ${state}</p>
    </li>
    `);

    $resultsList.append(newLi);
};
