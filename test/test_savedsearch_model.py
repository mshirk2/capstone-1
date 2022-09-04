"""SavedSearch model tests"""

import os
from unittest import TestCase
from sqlalchemy import exc
from models import db, User, SavedSearch

os.environ['DATABASE_URL'] = "postgresql:///flusher-test"

from app import app
app.config['TESTING'] = True
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']

db.create_all()

class SavedSearchModelTestCase(TestCase):
    """Test SavedSearch model"""

    def setUp(self):
        """Create test client, add sample data"""

        User.query.delete()
        SavedSearch.query.delete()

        self.u1 = User.signup(
            email="test1@test.com",
            username="testuser1",
            password="password",
        )
        self.u1.id = 111

        self.s1 = SavedSearch(
            name="testSavedSearch",
            user_id = self.u1.id,
            query_string="search-string",
            lon=75.245,
            lat=35.475,
            accessible = True,
            unisex = True,
            changing_table = False,
        )
        self.s1.id = 222

        db.session.add(self.s1)
        db.session.commit()

        self.client = app.test_client()

    def tearDown(self):
        db.session.rollback()

##################################################
# Basic model Tests

    def test_savedsearch_model(self):
        """Does the basic model work? Saved search should have a user_id which matches our sample data"""

        self.assertEqual((self.s1.user_id), 111)
    
    
    def test_savedsearch_model_repr(self):
        """Does the repr method work as expected?"""

        self.assertEqual("<SavedSearch - id: 222, user_id: 111, name: testSavedSearch>", repr(self.s1))
        self.assertNotEqual("<SavedSearch - id: 999, user_id: 788, name: wronganswerbuddy>", repr(self.s1))


##################################################
# Serialize Tests    

    def test_savedsearch_serialize(self):
        """Does SavedSearch.serialize work as expected?"""


        self.assertEqual({
            'id': 222,
            'user_id': 111,
            'name': "testSavedSearch",
            'query_string': "search-string",
            'lon': 75.245,
            'lat': 35.475,
            'accessible': True,
            'unisex': True,
            'changing_table': False,
        }, SavedSearch.serialize(self.s1))

        self.assertNotEqual({
            'id': 8799,
            'user_id': 38452,
            'name': "thisname",
            'query_string': "askjeeves",
            'lon': 758413,
            'lat': 38425,
            'accessible': False,
            'unisex': False,
            'changing_table': True,
        }, SavedSearch.serialize(self.s1))