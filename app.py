from flask import Flask, render_template, request, flash, redirect, session, g, jsonify
from sqlalchemy.exc import IntegrityError
from forms import RegisterForm, UserEditForm, LoginForm
from models import db, connect_db, User, Restroom
import os

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    os.environ.get('DATABASE_URL', 'postgresql:///restroom-finder'))
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


#########################################################################
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

    If the there already is a user with that username: flash message
    and re-present form.
    """

    form = UserAddForm()

    if form.validate_on_submit():
        try:
            user = User.signup(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
                image_url=form.image_url.data or User.image_url.default.arg,
            )
            db.session.commit()

        except IntegrityError:
            flash("Username already taken", 'danger')
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
        user = User.authenticate(form.username.data,
                                 form.password.data)

        if user:
            do_login(user)
            flash(f"Hello, {user.username}!", "success")
            return redirect("/")

        flash("Invalid credentials.", 'danger')

    return render_template('users/login.html', form=form)


@app.route('/logout')
def logout():
    """Handle logout of user."""

    do_logout()
    flash("Goodbye!", "success")
    return redirect("/login")


#########################################################################
# Homepage, search, and error pages


@app.route('/')
def root():
    """Homepage. If user is logged in, redirect ot search page, otherwise show landing page."""

    if g.user:
        return redirect("/search")

    return render_template('landing.html')


@app.route('/search')
def show_search_page():
    """Show search page, including search form and results"""

    return render_template("search.html", token=os.environ['MAPBOX_TOKEN'])


@app.errorhandler(404)
def page_not_found(e):
    """404 Page Not Found"""

    return render_template('404.html'), 404


#########################################################################
# API routes

# @app.route("/restrooms")
# def get_restrooms():
#     """Get data about all restrooms"""

#     restrooms = [restroom.to_dict() for restroom in Restroom.query.all()]

#     return jsonify(restrooms=restrooms)


# @app.route("/restrooms/<int:restroom_id>")
# def show_restroom(restroom_id):
#     """Get data about a single restroom"""

#     restroom = Restroom.query.get_or_404(restroom_id)

#     return jsonify(restroom=restroom.to_dict())

@app.route("/api/reverse-geocode")
def get_reverse_geocode():
    """Get mapbox result using coordinates"""

    lat = request.json['lat']
    lon = request.json['lon']
    token = os.environ['MAPBOX_TOKEN']

    mapbox_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{lon},{lat}.json?worldview=cn&access_token={token}"

    resp = requests.get(mapbox_url)
    result = resp.json()['features'][0]['place_name']

    return (jsonify(result=result), 200)

