import os

# Config
basedir = os.path.dirname(os.path.realpath(__file__))

UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
ALLOWED_EXTENSIONS = set(
    ['wav', 'mov', 'avi', 'mkv', 'mp4', 'webm', 'mp3', 'm4a', 'wma',
     'wmv', 'ogv', 'mpg', 'mpeg'])

# Please change it in production :)
SECRET_KEY = 'My_awes0m3_s3cret_key:CHANGE THIS!'

# Flask-security settings
SECURITY_TRACKABLE = True
SECURITY_SEND_REGISTER_EMAIL = False
SECURITY_PASSWORD_HASH = 'bcrypt'
SECURITY_PASSWORD_SALT = 'd41d8cd98f00b204e9800998ecf8427e'

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

JSON_AS_ASCII = False

VOXO_ROLE_ADMIN = 'admin'
VOXO_ROLE_USER = 'user'
VOXO_ROLE_SERVER = 'server'
VOXO_PHONE = False
VOXO_EN = True
VOXO_EDITOR = True
DEBUG = True
