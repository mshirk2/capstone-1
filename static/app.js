const BASE_URL = "https://www.refugerestrooms.org/api"

// Search input
let CURRENT_LAT;
let CURRENT_LON;
let GEOCODER;
const $geocoderContainer = $('#geocoder-container');
const $searchButton = $('#search-button');

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


const handleSearch = async () => {

    // clear previous search results from internal storage, results list, and map
    RESTROOM_RESULTS.clear();
    $resultsList.empty();
    clearMapMarkers();

    // get coordinates based on search input
    const coordinates = getCoordinates();

    await getResults(coordinates.lat, coordinates.lon);

}


const getCoordinates = () => {
    
    // Default to current location
    let coords = {
        lat: CURRENT_LAT,
        lon: CURRENT_LON,
    };

    return coords;
}


const getResults = async (lat, lon) => {

    const per_page = NUM_RESULTS;

    resp = axios.get(`${BASE_URL}/v1/restrooms/by_location?lat=${lat}&lng=${lon}&ada=${$isAccessible}&unisex=${$isUnisex}&per_page=${per_page}`)

    displayResults(resp)
}


const displayResults = async (resp) => {
    let restrooms = resp.data;

    for (let i = 0; i < restrooms.length; i++){
        const restroom = restrooms[i];

        const restroomData = {
            name: restroom.name,
            lat: restroom.latitude,
            lon: restroom.longitude,
        };

        RESTROOM_RESULTS.set(restroom.id, restroom);

        addMapMarker(restroom);
        addResultToDOM(restroom);

        if (RESTROOM_RESULTS.size === NUM_RESULTS){
            break;
        }
    }

    return restrooms
}

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
        <p>${street}</p>
        <p>${city}, ${state}</p>
    </li>
    `);

    $resultsList.append(newLi);
};
