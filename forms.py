from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField
from wtforms.validators import DataRequired, Email, Length


class RegisterForm(FlaskForm):
    """Form for adding users."""

    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[Length(min=6)])


class UserEditForm(FlaskForm):
    """Form for editing users. Enter password to validate changes."""

    username = StringField('Username')
    email = StringField('Email', validators=[Email()])
    location = StringField('(Optional) Location')
    password = PasswordField('Password', validators=[DataRequired()]) 


class LoginForm(FlaskForm):
    """Login form."""

    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[Length(min=6)])
