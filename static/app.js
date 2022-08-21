// Search
const $searchButton = $('#search-button');
const $searchResults = $('#search-results');
const $geocoder = $('#geocoder');

const BASE_URL = "https://www.refugerestrooms.org/api"


// Search button Event Handler
$searchButton.on('click', (evt)=>{
    evt.preventDefault();

    getSearchResults();
})

const getSearchResults = async () => {

    // clear previous search results
    $searchResults.empty();

    // get coordinates based on search input
    const coordinates = getCoordinates();

    await displayResults(coordinates.lat, coordinates.lon);

}

const getCoordinates = () => {

}