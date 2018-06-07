from flask import abort, Blueprint, send_from_directory, render_template, g, url_for
from flask_security import login_required
from flask_login import current_user
from flask import current_app
from api.correction import correction_api
from api.mediafile import media_file_api

import json

# Specify static_url_path because of a bug in Flask 
# with blueprints registered with an url_prefix
# https://github.com/mitsuhiko/flask/issues/348
frontend = Blueprint('frontend', __name__,
                template_folder='templates',
                static_folder='static',
                static_url_path='/%s' % __name__
                )

@frontend.before_request
def before_request():
    g.user = current_user

@frontend.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(frontend.config['UPLOAD_FOLDER'],
                               filename)


@frontend.route('/')
@login_required
def index():
    return render_template(
            'frontend/home.html', 
            auth_token=current_user.get_auth_token(),
            english=current_app.config['VOXO_EN'],
            phone=current_app.config['VOXO_PHONE'],
            editor=current_app.config['VOXO_EDITOR'])

@frontend.route('/correction/<int:file_id>')
@login_required
def correction(file_id):

    file = media_file_api.get_file_by_id(file_id)
    correction = correction_api.get_or_create_correction_for_file(file)

    if file is None or correction is None:
        abort(404)

    return render_template(
            'frontend/correction.html', 
            auth_token=current_user.get_auth_token(), 
            file=file, 
            correction=correction)


@frontend.route('/profile')
@login_required
def profile():
    return render_template(
            'frontend/profile.html', 
            auth_token=current_user.get_auth_token())


@frontend.route('/default-values.js')
@login_required
def default_values():
    return render_template(
            'frontend/default-values.js', 
            auth_token=current_user.get_auth_token(),
            english=json.dumps(current_app.config['VOXO_EN']), 
            editor=json.dumps(current_app.config['VOXO_EDITOR']))
