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
        await initializeMap(CURRENT_LAT, CURRENT_LON);
    } else {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                CURRENT_LAT = position.coords.latitude;
                CURRENT_LON = position.coords.longitude;
                console.log('lat, lon = ', CURRENT_LAT, CURRENT_LON)
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
        <div class="d-flex justify-content-between">
            <h4>${name}</h4>
            ${distance ? '<small class="ml-1">${distance.toFixed(2)} mi</small>' : ''}
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