const BASE_URL = "https://www.refugerestrooms.org/api"

function generateHTML(restroom) {
    return `
        <div data-id=${restroom.id}>
            <li>
                ${restroom.id} / ${restroom.name}
            </li>
        </div>
    `;
}

async function showRestrooms(){
    const response = await axios.get(`${BASE_URL}/restrooms`);

    for (let restroomData of response.data.restrooms){
        let newRestroom = $(generateHTML(restroomData));
        $("#restrooms-list").append(newRestroom);
    }
}