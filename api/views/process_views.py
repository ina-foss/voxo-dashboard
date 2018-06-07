from flask import current_app, request, make_response, jsonify, abort, send_file
from api.blueprint import api
from core import crossdomain
from flask_security import auth_token_required, roles_required
from flask_login import current_user

from api.views.all_views import api_version
from api.process import process_api
from api.transcription import transcription_api

from voxolab.models import ProcessType

import json, os
import sys

"""
@api {post} /api/v1.1/processes Start a transcription or an alignment process
@apiVersion 1.1.0
@apiName ProcessAdd
@apiGroup Transcriptions
@apiDescription This function allows you to start a process on the server. Usually, the process will be a transcription process, but you can add a process to align files too.

You can specify if you want a phone transcription by providing a "phone": true parameter in the JSON object passed in the body.

@apiParam {Integer} id The file id you want to transcribe. This id is returned after having uploaded a file.
@apiParam {Boolean} phone If the system should use the models trained for phone recordings.
@apiParam {String} type Must be set to <code>alignment</code> if you want to start an alignment process.

@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/v1.1/processes"
    -X POST 
    -d '{"id":3}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

or for a phone transcription:

    curl "https://dashboard.voxolab.com/api/v1.1/processes"
    -X POST 
    -d '{"id":3, "phone": true}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

or to start an alignment process (it's not language dependant):

    curl "https://dashboard.voxolab.com/api/v1.1/processes"
    -X POST 
    -d '{"id":3, "type": "alignment"}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "duration": null,
  "file_id": 3,
  "file_name": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
  "id": 10,
  "progress": 0,
  "status": "Queued",
  "status_id": 1,
  "transcription_auto_name": null,
  "transcription_id": null,
  "transcription_ref_name": null,
  "type": "Full transcription"
} 

@apiSuccess {Number} id the id of the process.
@apiSuccess {String} status the status of the process. Can be one of: <code>Queued</code>, <code>Started</code>, <code>Finished</code>, <code>Error</code>
@apiSuccess {Number} status_id the status id of the process. Can be one of: <code>1</code> (Queued), <code>2</code> (Started), <code>5</code> (Finished), <code>6</code> (Error)
@apiSuccess {Number} progress the percentage of progress
"""

@api.route('/processes', defaults={'api_version': 'v1'}, methods=['POST', 'OPTIONS'])
@api.route('/<api_version>/processes', methods=['POST', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def add_process(api_version):
    jsonContent = json.loads(request.data.decode('utf-8'))

    if('phone' in jsonContent and current_app.config['VOXO_PHONE']):
        phone = jsonContent['phone']
    else:
        phone = False

    if('english' in jsonContent):
        english = jsonContent['english']
    else:
        english = False

    if('type' in jsonContent):
        process_type = jsonContent['type']
    else:
        process_type = None

    if('asr_model_name' in jsonContent):
        asr_model_name = jsonContent['asr_model_name']
    else:
        asr_model_name = None

    if process_type is None \
            or process_type == ProcessType.FullTranscription \
            or process_type == ProcessType.FullPhoneTranscription \
            or process_type == ProcessType.FullEnglishTranscription \
            or process_type == ProcessType.CustomModelTranscription:

        process = process_api.add_decoding_process_for_user(
            jsonContent['id'],
            current_user.id,
            phone,
            english,
            api_version,
            asr_model_name)
    else:
        process = process_api.add_alignment_process_for_user(
            jsonContent['id'], current_user.id, api_version)

    return jsonify( process.to_dict() )

"""
@api {get} /api/v1.1/processes/:process_id Get a process
@apiVersion 1.1.0
@apiName GetProcess
@apiGroup Transcriptions
@apiDescription Return a process object by its id. Useful to know the progess of a transcriptipon.


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/v1.1/processes/12" 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "duration": null,
  "file_id": 3,
  "file_name": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
  "id": 12,
  "progress": 0,
  "status": "Queued",
  "status_id": 1,
  "transcription_auto_name": null,
  "transcription_id": null,
  "transcription_ref_name": null,
  "type": "Full transcription"
}

@apiSuccess {Number} progress the percentage of progress
"""
@api.route('/processes/<int:process_id>', defaults={'api_version': 'v1'}, methods = ['GET', 'OPTIONS'])
@api.route('/<api_version>/processes/<int:process_id>', methods = ['GET', 'OPTIONS'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def get_process(api_version, process_id):
    process = process_api.get_process_by_id_and_user_id(process_id, current_user.id)
    if process is None:
        abort(404)
    return jsonify( process.to_dict() )



"""
@api {delete} /api/v1.1/processes/:process_id Delete an unstarted process
@apiVersion 1.1.0
@apiName DeleteProcess
@apiGroup Transcriptions
@apiDescription Delete a process object by its id. You can only delete queued processes


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/v1.1/processes/12" 
    -X DELETE
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "success": "ok"
}

"""
@api.route('/processes/<int:process_id>', defaults={'api_version': 'v1'}, methods = ['DELETE'])
@api.route('/<api_version>/processes/<int:process_id>', methods = ['DELETE'])
@crossdomain(origin='*', headers='authentication-token')
@auth_token_required
@api_version
def delete_process(api_version, process_id):
    success = process_api.delete_unfinished_process_by_id_and_user(process_id, current_user.id)
    if not success:
        abort(404)
    return jsonify( { 'success': 'ok' } )

