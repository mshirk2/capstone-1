from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, IntegerField, BooleanField
from wtforms.validators import DataRequired, Email, Length, Optional


class RegisterForm(FlaskForm):
    """Form for adding users."""

    username = StringField(label='Username', validators=[DataRequired()])
    email = StringField(label='Email', validators=[DataRequired(), Email()])
    password = PasswordField(label='Password', validators=[Length(min=6)])


class UserEditForm(FlaskForm):
    """Form for editing users. Enter password to validate changes."""

    username = StringField(label='Username')
    email = StringField(label='Email', validators=[Email()])
    password = PasswordField(label='Password', validators=[DataRequired()]) 


class LoginForm(FlaskForm):
    """Login form."""

    identifier = StringField(label='Username or Email', validators=[DataRequired()])
    password = PasswordField(label='Password', validators=[Length(min=6)])


class SavedSearchEditForm(FlaskForm):
    """Form for editing saved search"""

    name = StringField(label='Name')
    query_string = StringField(label='Search term')
    accessible = BooleanField(label='Accessible')
    unisex = BooleanField(label='Unisex')
    changing_table = BooleanField(label='Changing Table')