# Flusher
An app which facilitates safe, convenient access to public restrooms for transgender, intersex, and gender nonconforming individuals and individuals with disabilities and/or limited mobility.

[Try it out]

## Features

- Use current location or specified location to search for nearby bathrooms
- Filter results by: unisex restrooms, accessible restrooms, and changing tables
- Results displayed in a list and map
- Restroom details and directions if available
- Save searches for easy recall
- User registration is not required to use the search function.


## Data Sources and Credits
Restroom data is supplied by the [Refuge Restrooms API](https://www.refugerestrooms.org/api/docs/).

Map and geoding by [Mapbox API](https://docs.mapbox.com/).

Credits to Tim Birk for the overall structure of the app. You can view his project [here](https://github.com/Tim-Birk/capstone-1).


## User Flow
### Sign Up
Sign up with a username, email and password. Passwords are hashed using bcrypt.

### Search Page
User can search by current location or specified location, and filter results. Results are displayed in a list and on a map, including basic information location name and address, with collapsible details and directions, if available. 

If registered, a user can save a search to their profile.

### User Profile
Displays saved searches with the ability to edit or delete. Users can also update their username or email.


