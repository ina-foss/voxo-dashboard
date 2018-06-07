from flask import jsonify, abort, request, make_response, send_file
from flask import current_app
from flask_security import auth_token_required
from flask_login import current_user
from functools import wraps

from models import FileStatus
from api.mediafile import media_file_api
from api.process import process_api
from api.transcription import transcription_api
from core import crossdomain
from collections import OrderedDict

import json
import os

from api.blueprint import api


def api_version(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Default to v1 API version
        api_version = 'v1'
        if('api_version' in kwargs):
            api_version = kwargs['api_version']
            if(api_version not in ['v1', 'v1.1']):
                api_version = 'v1'
        kwargs['api_version'] = api_version
        return f(*args, **kwargs)
    return decorated_function


"""
@api {post} /api/v1.1/transcriptions Upload transcriptions for alignment
@apiVersion 1.1.0
@apiName AlignFile
@apiGroup Align
@apiDescription This function allows you to upload files on the server to
 start an alignment. You need an xml file of the decoding and a
 .txt file containing the text to align. Be careful, the XML
 format has changed between v1.0 and v1.1. If you're using the v1.0 xml
 format, use the v1.0 alignement api.

@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/v1.1/transcriptions' -i 
    -F auto_file=@transcription.xml 
    -F ref_file=@transcription.txt 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):

HTTP/1.1 100 Continue

HTTP/1.1 200 OK
Server: nginx/1.4.6 (Ubuntu)
Date: Wed, 21 Jan 2015 15:38:44 GMT
Content-Type: application/json
Content-Length: 240
Connection: keep-alive
Set-Cookie: session=eyJfaWQiOiJhZmRiN2UwZDk4YmM4Y2U5N2M4OGNjY2FhZDRlNTU3OCJ9.B6FZhA.kfjQFjfXSuwbilC4ZjROgHUXdzA; HttpOnly; Path=/

{
  "status": 1,
  "transcription": {
    "aligned_filename": null,
    "auto_filename": "2_auto_transcription.xml",
    "id": 2,
    "ref_filename": "2_ref_transcription.txt",
    "user_id": 1
  }
}
"""


@api.route('/transcriptions', defaults={'api_version': 'v1'}, methods=['POST'])
@api.route('/<api_version>/transcriptions', methods=['POST'])
@auth_token_required
@api_version
def upload_transcription(api_version):

    auto_file = request.files['auto_file']
    ref_file = request.files['ref_file']

    (status, transcription) = transcription_api.store_and_save_transcription_files(auto_file, ref_file, current_user.id)

    if(status == FileStatus.Success):
        return jsonify({"status" : FileStatus.Success, "transcription" : transcription.to_dict() })
    else:
        return make_response(jsonify( { 'error': 'They were an error during the upload. Please contact the administrator.' } ), 500)


"""
@api {delete} /api/v1.1/files/:file_id Mark a file as to be deleted
@apiVersion 1.1.0
@apiName DeleteFile
@apiGroup Files
@apiDescription Mark a file as "to be deleted". It will be added to the daemon delete queue.


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/v1.1/files/12" 
    -X DELETE
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "success": "ok"
}

"""
@api.route('/files/<int:file_id>', defaults={'api_version': 'v1'}, methods = ['DELETE'])
@api.route('/<api_version>/files/<int:file_id>', methods = ['DELETE'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def delete_file(api_version, file_id):

    file = media_file_api.get_file_by_id_and_user_id(file_id, current_user.id)

    if file is None:
        abort(404)

    media_file_api.mark_file_as_to_delete(file, current_user.id)
    media_file_api.delete_local_files(file, current_user.id)

    return jsonify( { 'success': 'ok' } )

@api.route('/download/<int:file_id>', defaults={'api_version': 'v1'}, methods=['GET'])
@api.route('/<api_version>/download/<int:file_id>', methods=['GET'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def download_user_file(api_version, file_id):

    file = media_file_api.get_file_by_id(file_id)


    if (request.args.get('format') == 'audio'):
        filepath=file.get_audio_file_path()
        file_basename, file_extension = os.path.splitext(file.filename)
        filename="{}_audio.wav".format(file_basename)
    else:
        filepath=file.get_file_path()
        filename=file.filename

    if(file is None or not os.path.isfile(os.path.join(current_app.config['UPLOAD_FOLDER'], filepath))):
        abort(404)

    if(file.user_id != current_user.id):
        abort(401)


    response = send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], file.get_file_path()))
    response.headers["Content-Disposition"] = "attachment; filename=" + filename

    return response


@api.route('/download/transcription/<int:transcription_id>', defaults={'api_version': 'v1'}, methods=['GET'])
@api.route('/<api_version>/download/transcription/<int:transcription_id>', methods=['GET'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def download_transription_file(api_version, transcription_id):

    transcription = transcription_api.get_transcription_by_id(transcription_id)

    if(transcription is None or transcription.aligned_filename is None):
        abort(404)
    if(transcription.user_id != current_user.id):
        abort(401)

    response = send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], transcription.get_aligned_path()))
    response.headers["Content-Disposition"] = "attachment; filename=" + transcription.aligned_filename

    return response


"""
Get info about the current logged-in user
"""
@api.route('/account', defaults={'api_version': 'v1'}, methods=['GET'])
@api.route('/<api_version>/account', methods=['GET'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def account_info(api_version):

    email = current_user.email
    infos = {'email': email, 'history': []}

    report = process_api.get_report(email)

    if email in report:
        for year in OrderedDict(sorted(report[email].items(), key=lambda t: t[0], reverse=True)):
            for month in OrderedDict(sorted(report[email][year].items(), key=lambda t: t[0], reverse=True)):
                duration = report[email][year][month]
                infos['history'].append({'month': month, 'year': year, 'duration': duration, 'hours': (duration/3600)})

    return make_response(json.dumps(infos), 200, {'Content-Type': 'application/json' })
