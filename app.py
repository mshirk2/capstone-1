from flask import Flask, render_template, request, flash, redirect, session, g, jsonify
from sqlalchemy.exc import IntegrityError
from forms import RegisterForm, UserEditForm, LoginForm, SavedSearchEditForm
from models import db, connect_db, User, SavedSearch
import requests
import os

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    os.environ.get('DATABASE_URL', 'postgresql:///flusher'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False

# Access tokens
from tokens import SECRET_KEY, MAPBOX_TOKEN
os.environ['SECRET_KEY'] = SECRET_KEY
os.environ['MAPBOX_TOKEN'] = MAPBOX_TOKEN

# Debug Toolbar
from flask_debugtoolbar import DebugToolbarExtension
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
debug = DebugToolbarExtension(app)

connect_db(app)

CURR_USER_KEY = "curr_user"
AUTH_ERROR = "Authorization Error: You are not authorized to access this page."


##################################################
# User signup/login/logout

@app.before_request
def add_user_to_g():
    """If we're logged in, add curr user to Flask global."""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])

    else:
        g.user = None


def do_login(user):
    """Log in user."""

    session[CURR_USER_KEY] = user.id


def do_logout():
    """Logout user."""

    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]


@app.route('/signup', methods=["GET", "POST"])
def signup():
    """Handle user signup.

    Create new user and add to DB. Redirect to home page.

    If form not valid, present form.

    If the there already is a user with that email: flash message
    and re-present form.
    """

    form = RegisterForm()

    if form.validate_on_submit():
        try:
            user = User.signup(
                username=form.username.data,
                email=form.email.data,
                password=form.password.data,
            )
            db.session.commit()

        except IntegrityError:
            flash("Email already taken", 'danger')
            return render_template('users/signup.html', form=form)

        do_login(user)

        return redirect("/")

    else:
        return render_template('users/signup.html', form=form)


@app.route('/login', methods=["GET", "POST"])
def login():
    """Handle user login."""

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(form.identifier.data, form.password.data)

        if user:
            do_login(user)
            flash(f"Hello, {user.username}!", "success")
            return redirect("/")

        flash("Invalid credentials.", 'danger')

    return render_template('users/login.html', form=form)


@app.route('/logout')
def logout():
    """Handle user logout."""

    do_logout()
    flash("Goodbye!", "success")
    return redirect("/login")


##################################################
# User profile routes

@app.route('/users/<int:user_id>')
def show_user(user_id):
    """Show user profile."""

    user = User.query.get_or_404(user_id)
   
    return render_template('users/show.html', user=user, AUTH_ERROR=AUTH_ERROR)


@app.route('/users/profile', methods=["GET", "POST"])
def edit_profile():
    """Update profile for current user."""

    if not g.user:
        flash(AUTH_ERROR, "danger")
        return redirect("/")
    
    user = g.user
    form = UserEditForm(obj=user)

    if form.validate_on_submit():
        if User.authenticate(user.email, form.password.data):
            user.username = form.username.data
            user.email = form.email.data

            db.session.commit()
            return redirect(f"/users/{user.id}")

        flash("Incorrect password. Please try again.", 'danger')

    return render_template('users/edit.html', form=form, user_id=user.id)


@app.route('/users/delete', methods=["POST"])
def delete_user():
    """Delete user."""

    if not g.user:
        flash(AUTH_ERROR, "danger")
        return redirect("/")

    do_logout()

    db.session.delete(g.user)
    db.session.commit()

    return redirect("/signup")


##################################################
# Saved Search routes

@app.route('/search/add', methods=["POST"])
def add_saved_search():
    """Add Saved Search"""
    
    if not g.user:
        flash(f'Please log in first.', "danger")
        return redirect(f"/login")

    user_id = g.user.id
    name = request.json['name']
    query_string = request.json['query_string']
    lon = request.json['lon']
    lat = request.json['lat']
    accessible = request.json['accessible']
    unisex = request.json['unisex']
    changing_table = request.json['changing_table']


    saved_search = SavedSearch(
        user_id=user_id,
        name=name, 
        query_string=query_string,
        lon=lon, 
        lat=lat,
        accessible=accessible, 
        unisex=unisex,
        changing_table=changing_table
    )
    db.session.add(saved_search)
    db.session.commit()
    
    return (jsonify(saved_search=saved_search.serialize()), 201)


@app.route('/search/<int:search_id>/edit', methods=["GET", "POST"])
def edit_saved_search(search_id):
    """Edit saved search"""
    
    saved_search = SavedSearch.query.get_or_404(search_id)
    
    if not g.user.id == saved_search.user_id:
        flash(AUTH_ERROR, "danger")
        return redirect("/login")
    
    form = SavedSearchEditForm(obj=saved_search)

    if form.validate_on_submit():
        saved_search.name = form.name.data

        db.session.commit()

        return redirect(f"/users/{saved_search.user_id}")

    return render_template('saved_searches/edit.html', form=form, saved_search=saved_search)


@app.route('/search/<int:search_id>/delete', methods=["GET","POST"])
def delete_saved_search(search_id):
    """Delete saved search"""

    saved_search = SavedSearch.query.get_or_404(search_id)
    
    if not g.user.id == saved_search.user_id:
        flash(AUTH_ERROR, "danger")
        return redirect("/login")

    db.session.delete(saved_search)
    db.session.commit()

    return redirect(f"/users/{saved_search.user_id}")


@app.route('/search/<int:search_id>')
def populate_search(search_id):
    """Individual saved search, returned jsonified to populate search parameters"""

    saved_search = SavedSearch.query.get_or_404(search_id)
    
    if not g.user.id == saved_search.user_id:
        flash(AUTH_ERROR, "danger")
        return redirect("/login")


    return (jsonify(saved_search=saved_search.serialize()), 201)

##################################################
# Homepage, Search Page, and error pages


@app.route('/')
def root():
    """Homepage. If user is logged in redirect to search page, otherwise show landing page."""

    if g.user:
        return redirect("/search")

    return render_template('landing.html')


@app.route('/search')
def show_search_page():
    """Show search page, including search form and results"""

    return render_template("search.html", mapboxToken=os.environ['MAPBOX_TOKEN'])


@app.errorhandler(404)
def page_not_found(e):
    """404 Page Not Found"""

    return render_template('404.html'), 404


##################################################
# API routes


@app.route("/api/reverse-geocode", methods=["POST"])
def get_reverse_geocode():
    """Show top result through mapbox using coordinates"""

    lon = request.json['lon']
    lat = request.json['lat']
    token = os.environ['MAPBOX_TOKEN']

    mapbox_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{lon},{lat}.json?&access_token={token}"

    resp = requests.get(mapbox_url)

    # Return empty object if no results
    if resp.json()['features'] == []:
        return(jsonify(detail={}), 200)

    try:
        result = resp.json()['features'][0]['place_name']
        return (jsonify(result=result), 200)
    except e as exception:
        return (jsonify(detail={}), 200)

