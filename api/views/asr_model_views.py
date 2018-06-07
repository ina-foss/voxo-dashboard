import json
from flask import abort, current_app, jsonify, make_response
from api.blueprint import api
from core import crossdomain
from flask_security import auth_token_required
from flask_login import current_user

from api.views.all_views import api_version

@api.route('/<api_version>/models', methods=['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def list_models(api_version):

    models = current_user.asr_models

    if(models):
        return make_response(
            json.dumps([m.to_dict() for m in models]),
            200,
            {'Content-Type': 'application/json' })
    else:
        abort(404)

