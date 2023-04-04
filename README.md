# Flusher
An app which facilitates safe, convenient access to public restrooms for transgender, intersex, and gender nonconforming individuals, and individuals with disabilities and/or limited mobility.

Try it out: https://mshirk-flusher.herokuapp.com/

## Features

- Use current location or specified location to search for nearby restrooms, with data supplied by [Refuge Restrooms API](https://www.refugerestrooms.org/api/docs/).
- Filter results by: unisex restrooms, accessible restrooms, and changing tables
- Results displayed in a list and map, via [Mapbox API](https://docs.mapbox.com/)
- View restroom details and notes, if available
- Save searches for easy recall

## User Flow
### Sign Up
Sign up with a username, email and password. Passwords are hashed using bcrypt.

### Search Page
User can search by current location or specified location, and filter results. Results are displayed in a list and on a map, including basic information location name and address, with collapsible details and directions, if available. 

If registered, a user can save a search to their profile.

### User Profile
Displays saved searches with the ability to edit or delete. Users can also update their username or email.

## Tech Stack
- Frontend: JavaScript, Bootstrap, AJAX, HTML, CSS
- Backend: Python, Flask, PostgreSQL, SQLAlchemy
- Testing: unittest Framework, including unit and integration tests

## Run Locally
To run locally, you will need a [Mapbox](https://docs.mapbox.com/help/getting-started/access-tokens/) access token.

1. Clone repository
    ```
    $ git clone https://github.com/mshirk2/capstone-1
    ```
2. Navigate to project directory
    ```
    $ cd capstone-1
    ```
3. Create tokens.py file
    ```
    $ touch tokens.py
    ```
4. Add secret key (any password of your choosing) and Mapbox token to tokens.py file
    ```
    SECRET_KEY = '[Secret key of your choosing]'
    MAPBOX_ACCESS_TOKEN = '[Your Mapbox access token]'
    ```
5. Create python virtual environment
    ```
    $ python -m venv venv
    ```
6. Activate virtual environment
    ```
    $ source venv/bin/activate
    ```
7. Install packages
    ```
    (venv) $ pip install -r requirements.txt
    ```
8. Start PostgresQL
    ```
    (venv) $ sudo service postgresql start
    ```
9.  Create PostgreSQL database
    ```
    (venv) $ createdb flusher
    ```
10. Run seed.py file to create database tables
    ```
    (venv) $ python seed.py
    ```
11. Run application
    ```
    (venv) $ flask run
    ```

### Run Tests
After installing locally use this command to 
1. Create PostgresQL test database
    ```
    (venv) $ createdb flusher-test
    ```
2. Run seed.py file to create database tables
    ```
    (venv) $ python seed.py
    ```
3. Run all tests
    ```
    (venv) $ python -m unittest
    ```
4. Or run a specific test file
    ```
    (venv) $ python -m unittest test/<file.py>
    ```

## Credits
Credits to Tim Birkmire for the overall structure of the app. You can view his project [here](https://github.com/Tim-Birk/capstone-1).

