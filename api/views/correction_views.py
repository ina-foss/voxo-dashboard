from flask import current_app, request, make_response, jsonify, abort
from api.blueprint import api
from core import crossdomain
from flask_security import auth_token_required, roles_required
from flask_login import current_user
from jsonschema import validate
from jsonschema.exceptions import ValidationError

from api.views.all_views import api_version
from api.correction import correction_api

@api.route('/<api_version>/corrections/<int:correction_id>', methods=['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def get_correction(api_version, correction_id):

    correction = correction_api.find_correction_by_id(correction_id)
    if(correction):
        return jsonify( correction.to_dict() )
    else:
        abort(404)


@api.route('/<api_version>/corrections', methods=['POST', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def add_correction(api_version):
    json = request.get_json()

    schema = {
            "content" : "string",
            "file_id" : "number",
            "format" : "string",
            "required": ["content", "file_id", "format"]
        }

    try:
        validate(json, schema)
    except ValidationError as ve:
        return make_response(jsonify( { 'error': ve.message } ), 400)

    correction = correction_api.add_correction(json['content'], json['file_id'], json['format'])

    return jsonify( correction.to_dict() )


@api.route('/<api_version>/corrections/<int:correction_id>', methods=['PUT', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def update_correction(api_version, correction_id):
    json = request.get_json()

    schema = {
            "content" : "string",
            "format" : "string",
            "required": ["content", "format"]
        }

    try:
        validate(json, schema)
    except ValidationError as ve:
        return make_response(jsonify( { 'error': ve.message } ), 400)


    correction = correction_api.find_correction_by_id(correction_id)
    if(correction):
        correction = correction_api.update_correction_content(correction, content=json['content'])
        return jsonify( correction.to_dict() )
    else:
        abort(404)

