import os

# Config
basedir = os.path.dirname(os.path.realpath(__file__))

UPLOAD_FOLDER = os.path.join(basedir, 'tests/uploads')
ALLOWED_EXTENSIONS = set(['wav', 'mov', 'avi', 'mkv', 'mp4', 'webm',
                          'mp3', 'm4a', 'wma'])

# Please change it in production :)
SECRET_KEY = 'My_awes0m3_s3cret_key:CHANGE THIS!'

# Flask-security settings
SECURITY_TRACKABLE = True
SECURITY_SEND_REGISTER_EMAIL = False
SECURITY_PASSWORD_HASH = 'bcrypt'
SECURITY_PASSWORD_SALT = 'd41d8cd98f00b204e9800998ecf8427e'

VOXO_ROLE_ADMIN = 'admin'
VOXO_ROLE_USER = 'user'
VOXO_ROLE_SERVER = 'server'

TESTING = True
LOGIN_DISABLED = True
CSRF_ENABLED = False
# SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'test.db')
# For testing purpose, use in-memory database
SQLALCHEMY_DATABASE_URI = 'sqlite://'
SQLALCHEMY_TRACK_MODIFICATIONS = False
