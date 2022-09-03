"""User model tests."""

# run these tests like:
#
#    python -m unittest tests/test_user_model.py

import os
from unittest import TestCase
from sqlalchemy import exc
from models import db, User, SavedSearch

os.environ['DATABASE_URL'] = "postgresql:///flusher-test"

from app import app
app.config['TESTING'] = True

db.create_all()

class UserModelTestCase(TestCase):
    """Test User Model"""

    def setUp(self):
        """Create test client, add sample data."""

        User.query.delete()
        SavedSearch.query.delete()

        self.u1 = User.signup(
            email="test1@test.com",
            username="testuser1",
            password="password",
        )

        self.u2 = User.signup(
            email="test2@test.com",
            username="testuser2",
            password="password",
        )

        self.u1.id = 123
        self.u2.id = 456

        db.session.commit()

        self.client = app.test_client()

    def tearDown(self):

        db.session.rollback()
    

##################################################
# Basic model Tests

    def test_user_model(self):
        """Does basic model work? User should have no saved searches"""

        self.assertEqual(len(self.u1.searches), 0)

    def test_user_model_repr(self):
        """Does the repr method work as expected?"""

        self.assertEqual("<User - id: 123, username: testuser1, email: test1@test.com>", repr(self.u1))
        self.assertNotEqual("<User - id: 456, username: testuser, email: test@test.com>", repr(self.u1))


##################################################
# Signup Tests

    def test_valid_signup(self):
        """Does User.signup successfully create a new user given valid credentials?"""

        user_valid = User.signup("validUser", "valid@user.com", "password")
        user_valid.id = 789
        db.session.commit()

        self.assertIsNotNone(user_valid)
        self.assertEqual(user_valid.username, "validUser")
        self.assertEqual(user_valid.email, "valid@user.com")
        self.assertNotEqual(user_valid.password, "password")
    
    def test_invalid_username(self):
        """Does User.signup fail to create a new user if username field is blank?"""

        invalid_username = User.signup(None, "username@username.com", "password")
        invalid_username.id = 111
        with self.assertRaises(exc.IntegrityError) as context:
            db.session.commit()

    def test_invalid_email(self):
        """Does User.signup fail to create a new user if email field is blank?"""

        invalid_email = User.signup("no_email", None, "password")
        invalid_email.id = 222
        with self.assertRaises(exc.IntegrityError) as context:
            db.session.commit()

    def test_invalid_password(self):
        """Does User.signup fail to create a new user if password field is blank?"""

        with self.assertRaises(ValueError) as context:
            User.signup("no_password", "password@password.com", None)
            User.signup("no_password", "password@password.com", "")


##################################################
# Authentication Tests

    def test_valid_username_authentication(self):
        """Does User.authenticate successfully authenticate with username given valid credientials?"""

        user = User.authenticate(self.u1.username, "password")
        self.assertEqual(user.id, self.u1.id)

    def test_valid_email_authentication(self):
        """Does User.authenticate successfully authenticate with email given valid credientials?"""

        user = User.authenticate(self.u1.email, "password")
        self.assertEqual(user.id, self.u1.id)

    def test_invalid_username(self):
        """Does User.authenticate fail with an incorrect username?"""

        self.assertFalse(User.authenticate("wrongusername", "password"))

    def test_invalid_username(self):
        """Does User.authenticate fail with an incorrect email?"""

        self.assertFalse(User.authenticate("wrong@wrongwrong.wrong", "password"))

    def test_invalid_password(self):
        """Does User.authenticate fail with an incorrect password?"""

        self.assertFalse(User.authenticate(self.u1.username, "wrongpassword"))