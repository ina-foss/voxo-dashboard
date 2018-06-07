from flask import Flask, make_response, jsonify
from flask_babel import Babel
from flask_security import SQLAlchemyUserDatastore
from flask_compress import Compress
import os

from core import db, security
from models import User, Role
from api.mediafile import media_file_api
from api.process import process_api
from api.transcription import transcription_api
from api.correction import correction_api


def create_app(cfg=None):
    app = Flask(__name__)

    load_config(app, cfg)

    # SQLAlchemy
    db.init_app(app)

    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    security.init_app(app, user_datastore)

    media_file_api.init_defaults(db, app.config['UPLOAD_FOLDER'],
                                 app.config['ALLOWED_EXTENSIONS'])
    process_api.init_defaults(db)
    transcription_api.init_defaults(db, app.config['UPLOAD_FOLDER'])
    correction_api.init_defaults(db)

    babel = Babel()
    babel.init_app(app)

    compress = Compress()
    compress.init_app(app)

    from api.views.internal_views import api as api_internal_views
    from api.views.asr_model_views import api as api_asr_model_views
    from api.views.process_views import api as api_process_views
    from api.views.correction_views import api as api_correction_views
    from api.views.files_views import api as api_files_views
    from api.views.all_views import api as api_all_views
    from api.blueprint import api
    from frontend.views import frontend

    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(api, url_prefix='/api/<version>')
    app.register_blueprint(frontend)

    configure_filters(app)

    @app.errorhandler(404)
    def not_found(error):
        return make_response(jsonify({'error': 'Not found'}), 404)

    @app.errorhandler(400)
    def not_found(error):
        return make_response(jsonify({'error': 'Bad request'}), 400)

    return app


def configure_filters(app):
    from frontend import filters
    app.jinja_env.filters['datetime'] = filters.datetime_filter
    app.jinja_env.filters['role'] = filters.role_filter
    app.jinja_env.filters['human_size'] = filters.human_size_filter
    app.jinja_env.filters['upload_status'] = filters.upload_status_filter


def load_config(app, cfg):
    # Load a default configuration file
    app.config.from_pyfile('config.py')

    # If cfg is empty try to load config file from environment variable
    if cfg is None and 'YOURAPPLICATION_CFG' in os.environ:
        cfg = os.environ['YOURAPPLICATION_CFG']

    if cfg is not None:
        app.config.from_pyfile(cfg)
