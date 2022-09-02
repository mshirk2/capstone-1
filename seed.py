"""Seed file for sample data"""

from models import db, User, SavedSearch
from app import app

# Drop all tables, and create them
db.drop_all()
db.create_all()

# Sample users
u1 = User.signup(
    username = 'SmeveMcBichael05',
    email='smeve@email.com', 
    password='banana',
    )

u2 = User.signup(
    username = 'BobsonDugnutt99',
    email='bobson@email.com', 
    password='dumdumdum',
    )

u3 = User.signup(
    username = 'DemoUser',
    email='demoemail@email.com', 
    password='password',
    )


db.session.add_all([u1, u2, u3])
db.session.commit()

s1 = SavedSearch(
    user_id=u1.id,
    name="My favorite Poo-poo spot", 
    use_current_location=True,
    accessible=False,
    unisex=True,
    changing_table=False,
    )

s2 = SavedSearch(
    user_id=u1.id,
    name="My second favorite Poo-poo spot", 
    use_current_location=True,
    accessible=False,
    unisex=False,
    changing_table=False,
    )

db.session.add_all([s1, s2])
db.session.commit()