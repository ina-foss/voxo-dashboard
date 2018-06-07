from flask import request, make_response, jsonify, abort, send_file
from api.blueprint import api
from core import crossdomain
from flask_security import auth_token_required, roles_required
from flask_login import current_user
from models import FileStatus

from api.views.all_views import api_version
from api.mediafile import media_file_api
from api.process import process_api
from api.transcription import transcription_api

import json
import os
import sys

"""
@api {get} /api/v1.1/files Request a list of files
@apiName GetFiles
@apiVersion 1.1.0
@apiGroup Files
@apiDescription This function returns an Array of file Object.
Each file object is described above.
@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/v1.1/files'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
 HTTP/1.1 200 OK
Content-Type: application/json

[
 {
  "size": 2217030, 
  "user_id": 1, 
  "created_at": "30-05-2014 22:46:00", 
  "id": 2, 
  "size_human": "2M", 
  "status": 1, 
  "filename": "lcp_q_gov.wav", 
  "generated_filename": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", 
  "duration": 69, 
  "processes": 
    [
      {"type": "Full transcription", "transcription_auto_name": null, "file_name": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", "id": 3, "file_id": 2, "status": "Queued", "transcription_id": null, "duration": 704, "transcription_ref_name": null, "progress": 100}, 
      {"type": "Full transcription", "transcription_auto_name": null, "file_name": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", "id": 4, "file_id": 2, "status": "Queued", "transcription_id": null, "duration": null, "transcription_ref_name": null, "progress": 10}, 
    ]
 }
]
"""
@api.route('/files', defaults={'api_version': 'v1'}, methods = ['GET', 'OPTIONS'])
@api.route('/<api_version>/files', methods = ['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def get_files(api_version):
    page = request.args.get('page')
    filesPerPage = request.args.get('filesPerPage')

    nb_files = media_file_api.get_nb_files_for_user(current_user.id)

    if(page is None):
        # Old format
        files = media_file_api.get_files_for_user(current_user.id)

        return make_response(
            json.dumps([f.to_dict() for f in files]),
            200,
            {'Content-Type': 'application/json'}
        )
    else:
        files = \
            media_file_api.get_files_for_user(
                    current_user.id,
                    int(page),
                    int(filesPerPage)
            )

        return make_response(
            json.dumps({
                'nb': nb_files,
                'files': [f.to_dict() for f in files]
            }),
            200,
            {'Content-Type': 'application/json'}
        )



@api.route('/files/<int:file_id>', defaults={'api_version': 'v1'}, methods = ['GET', 'OPTIONS'])
@api.route('/<api_version>/files/<int:file_id>', methods = ['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def get_file(api_version, file_id):

    file = media_file_api.get_file_by_id_and_user_id(file_id, current_user.id)

    if file is None:
        abort(404)

    return jsonify( file.to_dict() )

"""
@api {get} /api/v1.1/files/:file_id/transcription Download transcription result
@apiVersion 1.1.0
@apiName GetTranscription
@apiGroup Transcriptions
@apiDescription Returns the transcription as the body of the response. 6 formats are supported: srt, ctm, xml, vtt, scc and txt. Be careful, compared to v1.0 of the api, the xml has changed (utf-8, new entity names). The <a href="http://docs.voxolab.com/voxolab-xmlv2.dtd">DTD of the XML is available here</a>.

@apiParam {String} format format of the file to download. Can be <code>srt</code>, <code>ctm</code>, <code>txt</code> or <code>xml</code>.

@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?format=xml" 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

"""

@api.route('/files/<int:file_id>/transcription', defaults={'api_version': 'v1'}, methods=['GET'])
@api.route('/<api_version>/files/<int:file_id>/transcription', methods=['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def get_transcription(api_version, file_id):

    media_file = media_file_api.get_file_by_id(file_id)

    if(media_file is None):
        abort(404)

    if(media_file.user_id != current_user.id):
        abort(401)

    formats = ['ctm', 'xml', 'vtt', 'txt', 'otr', 'scc']

    if (request.args.get('format') in formats):
        file_format = request.args.get('format')
    else:
        file_format = 'srt'

    if(file_format == 'xml' and api_version != 'v1'):
        file_format = 'v2.xml'

    filepath = transcription_api.get_transcription_file_path(media_file, file_format)

    if(os.path.exists(filepath)):
        return send_file(filepath, as_attachment=True, mimetype='text/plain')
    else:
        if(file_format == 'otr'):
            # Generate the otr file
            if(transcription_api.convert_xml_to_otr(media_file)):
                filepath = transcription_api.get_transcription_file_path(media_file, 'otr')
                return send_file(filepath, as_attachment=True, mimetype='text/plain')
            else:
                abort(404)

            pass
        elif(file_format == 'v2.xml'):
            # Fallback to xml
            filepath = transcription_api.get_transcription_file_path(media_file, 'xml')
            if(os.path.exists(filepath)):
                return send_file(filepath, as_attachment=True, mimetype='text/plain')
            else:
                abort(404)

        else:
            abort(404)

@api.route('/files/<int:file_id>/transcription', defaults={'api_version': 'v1'}, methods=['POST'])
@api.route('/<api_version>/files/<int:file_id>/transcription', methods=['POST'])
@auth_token_required
@roles_required('server')
@api_version
@crossdomain(origin='*', headers='authentication-token')
def upload_transcription_for_file(api_version, file_id):

    media_file = media_file_api.get_file_by_id(file_id)
    if(media_file is None):
        abort(404)

    file = request.files['file']
    (status, filename) = transcription_api.store_and_save_transcription_result(file, media_file.user_id)

    if(status == FileStatus.Success):
        return jsonify({"status" : FileStatus.Success})
    else:
        return make_response(jsonify( { 'error': 'They were an error during the upload. Please contact the administrator.' } ), 500)


"""
@api {post} /api/v1.1/files Upload a file and start a transcription
@apiVersion 1.1.0
@apiName UploadFile
@apiGroup Files

@apiDescription This function allows you to upload a file to the server and start the transcription.

By default, it will start a transcription using studio quality and French as the default language. If you want to start a phone transcription or change the lang ("fr", "en" are available) you can pass a form field object named "content" describing what you want. Quality can be "phone" or "studio", lang can be "en" or "fr".

content='{"start": true, "lang": "fr", "quality":"studio"}'


@apiParam {String} content Optional Json object of the form: {"start": true, "lang": "fr", "quality":"studio"}

@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/v1.1/files' -i
    -X POST
    -F file=@lcp_q_gov.wav 
    -F content='{"start": true, "asr_model_name": "french.studio.fr_FR"}'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json

{
  "created_at": "02-06-2014 09:56:26",
  "duration": 69,
  "filename": "lcp_q_gov.wav",
  "generated_filename": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
  "id": 3,
  "processes": [],
  "size": 2217030,
  "size_human": "2M",
  "status": 1,
  "user_id": 1
}
"""
@api.route('/files', defaults={'api_version': 'v1'}, methods=['POST', 'OPTIONS'])
@api.route('/<api_version>/files', methods=['POST', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
def upload_file(api_version):

    jsonContent = None
    try:
        if('content' in request.values):
            if(api_version == 'v1'):
                return make_response(jsonify( { 'error': "You need to use the version 1.1 of the api to pass json content to this call." } ), 500)
            else:
                jsonContent = json.loads(request.values['content'])
    except Exception as e:
        return make_response(jsonify( { 'error': "It seems that we can't parse valid json from your request. Please be sure you are submitting json data in the content field." } ), 500)


    # Should we start a transcription process?
    start = False
    phone = False
    english = False
    lang = 'fr'
    asr_model_name = None

    # This is available only for api version > 1.0
    if(api_version != 'v1' and jsonContent is not None):

        if('start' in jsonContent and jsonContent['start'] == False):
            start = False
        else:
            start = True

        if('lang' in jsonContent and (jsonContent['lang'].lower() in ['fr', 'en'])):
            lang = jsonContent['lang'].lower()
            
        # Phone is available only for french
        if('quality' in jsonContent and jsonContent['quality'].lower() == 'phone' and lang == 'fr'):
            phone = True


        if('asr_model_name' in jsonContent):
            asr_model_name = jsonContent['asr_model_name']

            models = current_user.asr_models

            match_models = [m for m in models if m.name==asr_model_name]

            if(len(match_models) == 0):
                # Model not found, should throw a 400 status code
                return make_response(
                    jsonify( 
                        { 'error': 'Model {model} does not exist in database.'
                            ' Available models are: {models}'\
                            .format(model=asr_model_name, models=models)
                        } )
                    , 400)


    if(lang == 'en'):
        english = True

    try:
        print(request.files['file'])
    except Exception as e:
        print("Error {0}".format(e), file=sys.stderr)
        return make_response(jsonify( { 'error': 'Missing file in request.' } ), 400)

    file = request.files['file']
    (status, media_file) = media_file_api.store_and_save_uploaded_file(
                            file,
                            current_user.id)

    if(status == FileStatus.Success):
        if(start):
            process = process_api.add_decoding_process_for_user(
                        media_file.id,
                        current_user.id,
                        phone,
                        english,
                        api_version,
                        asr_model_name)

        return jsonify(media_file.to_dict())
    elif(status == FileStatus.ExtensionNotAllowed):
        return make_response(jsonify( { 'error': 'File extension not allowed.' } ), 400)
    else:
        return make_response(jsonify( { 'error': 'They were an error during the upload. Please contact the administrator.' } ), 500)

