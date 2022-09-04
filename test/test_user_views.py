"""User view tests."""


import os
from unittest import TestCase
from sqlalchemy import exc
from models import db, User, SavedSearch

os.environ['DATABASE_URL'] = "postgresql:///flusher-test"

from app import app, CURR_USER_KEY, AUTH_ERROR
app.config['TESTING'] = True
app.config['WTF_CSRF_ENABLED'] = False
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']

db.create_all()

class UserViewTestCase(TestCase):
    """Test views"""

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
# Landing Tests

    def test_anonuser_landing(self):
        """Is anon user redirected to landing page?"""

        with self.client as c:
            
            resp = c.get('/', follow_redirects=True)
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn('<div class="landing-container">', html)
            self.assertNotIn('<div id="search-form">', html)


    def test_validuser_landing(self):
        """Is a logged in user redirected to the search page?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            resp = c.get('/', follow_redirects=True)
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn('<div id="search-form">', html)
            self.assertNotIn('<div class="landing-container">', html)


##################################################
# User Profile Tests

    def test_user_profile(self):
        """Can logged in user view own profile?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            resp = c.get(f'/users/{self.u1.id}')
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn(f"<h1>Hi, {self.u1.username}</h1>", html)
            self.assertNotIn(f"{AUTH_ERROR}", html)           

    def test_user_profile(self):
        """Can logged in user not view another profile?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            resp = c.get(f'/users/456', follow_redirects=True)
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn(f"{AUTH_ERROR}", html)
            self.assertNotIn(f"<h1>Hi, {self.u1.username}</h1>", html)  
    
    
    def test_edit_page(self):
        """Does edit profile page render?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id

            resp = c.get('/users/profile')
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Edit Your Profile</h1>", html)
            self.assertIn("testuser1", html)


    def test_user_edit(self):
        """Does edit form submit successfully and render on profile?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            form_data = {"username":"edited-name", "email":"edited-email@email.com", "password":"password"}
            resp = c.post("/users/profile", data=form_data, follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Does info successfully update?
            user = User.query.get(self.u1.id)
            self.assertEqual(user.username, "edited-name")
            self.assertEqual(user.email, "edited-email@email.com")
            self.assertNotEqual(user.email, "test1@test.com")
            
            # Does updated info successfully render on profile?
            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Hi, edited-name</h1>", html)
            self.assertNotIn("<h1>Hi, testuser1</h1>", html)


    def test_user_delete(self):
        """Can user delete profile successfully?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            resp = c.post('/users/delete', follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Is user redirected to login?
            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Create an account</h1>", html)
            self.assertNotIn("testuser1", html)

            # Is user deleted from users table?
            user = User.query.get(self.u1.id)
            self.assertIsNone(user)


##################################################
# User Signup tests

    def test_signup_page(self):
        """Does signup page render?"""

        with self.client as c:
            
            resp = c.get('/signup')
            html = resp.get_data(as_text=True)

            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Create an account</h1>", html)
            self.assertNotIn("testuser1", html)

    
    def test_user_signup(self):
        """Does signup form render and submit successfully?"""

        with self.client as c:
            
            form_data = {"username":"new-user", "email":"new-user@email.com","password":"new-password"}
            resp = c.post("/signup", data=form_data, follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Is user redirected to search page?
            self.assertEqual(resp.status_code, 200)
            self.assertIn('<div id="search-form">', html)
            self.assertNotIn("<h1>Hi, testuser1</h1>", html)
            self.assertNotIn('field_error',html )


##################################################
# User Login/Logout tests

    
    def test_login_page(self):
        """Does login page render?"""

        with self.client as c:
            
            resp = c.get('/login')
            html = resp.get_data(as_text=True)

            # Does login form render?
            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Welcome back</h1>", html)
            self.assertNotIn("testuser1", html)
    
    
    def test_user_login_email(self):
        """Does login form render? If user uses email, does login submit and redirect successfully?"""

        with self.client as c:

            form_data = {"identifier":"test1@test.com","password":"password"}
            resp = c.post("/login", data=form_data, follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Is user redirected to search page?
            self.assertEqual(resp.status_code, 200)
            self.assertIn('<div id="search-form">', html)
            self.assertNotIn('field_error',html )


    def test_user_login_username(self):
        """Does login form render? If user uses username, does login submit and redirect successfully?"""

        with self.client as c:
            
            form_data = {"identifier":"testuser1","password":"password"}
            resp = c.post("/login", data=form_data, follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Is user redirected to search page?
            self.assertEqual(resp.status_code, 200)
            self.assertIn('<div id="search-form">', html)
            self.assertNotIn('field_error',html )

    
    def test_user_logout(self):
        """Does user logout submit successfully?"""

        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1.id
            
            resp = c.get('/logout', follow_redirects=True)
            html = resp.get_data(as_text=True)

            # Is user redirected to login?
            self.assertEqual(resp.status_code, 200)
            self.assertIn("<h1>Welcome back</h1>", html)
            self.assertNotIn("testuser1", html)
