from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField
from wtforms.validators import DataRequired, Email, Length


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
