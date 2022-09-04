"""SQLAlchemy models"""

from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy

bcrypt = Bcrypt()
db = SQLAlchemy()


def connect_db(app):
    """Connect this database to app."""

    db.app = app
    db.init_app(app)


class User(db.Model):
    """User model"""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.Text, nullable=False, unique=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    password = db.Column(db.Text, nullable=False)
    
    searches = db.relationship('SavedSearch', backref='user', cascade='all, delete', passive_deletes=True)


    def __repr__(self):
        """Show info about user"""

        return f"<User - id: {self.id}, username: {self.username}, email: {self.email}>"

    @classmethod
    def signup(cls, username, email, password):
        """Register user with hashed password. Returns user."""

        hashed_pwd = bcrypt.generate_password_hash(password).decode('UTF-8')

        user = User(
            username=username,
            email=email,
            password=hashed_pwd,
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, identifier, password):
        """Find user with `email` or `username` and `password`.

        This is a class method (call it on the class, not an individual user.) It searches for a user whose password hash matches this password and, if it finds such a user, returns that user object.

        If can't find matching user (or if password is wrong), returns False.
        """

        user = cls.query.filter_by(username=identifier).first()

        if user:
            is_auth = bcrypt.check_password_hash(user.password, password)
            if is_auth:
                return user
        
        else:
            user = cls.query.filter_by(email=identifier).first()
            if user:
                is_auth = bcrypt.check_password_hash(user.password, password)
                if is_auth:
                    return user

        return False

class SavedSearch(db.Model):
    "Model for saved search"

    __tablename__ = "saved_searches"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    name = db.Column(db.String(100), nullable=False)
    query_string = db.Column(db.Text, nullable=True)
    lon = db.Column(db.Float, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    accessible = db.Column(db.Boolean, nullable=False, default=False)
    unisex = db.Column(db.Boolean, nullable=False, default=False)
    changing_table = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        """Show info about saved search"""

        return f"<SavedSearch - id: {self.id}, user_id: {self.user.id}, name: {self.name}>"

    def serialize(self):
        """Return data in json-friendly format"""

        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'query_string': self.query_string,
            'lon': self.lon,
            'lat': self.lat,
            'accessible': self.accessible,
            'unisex': self.unisex,
            'changing_table': self.changing_table,
        }