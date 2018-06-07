from flask import Blueprint, jsonify, abort, request, redirect, url_for, send_from_directory, make_response, Response, send_file
from flask import current_app
from flask_security import auth_token_required, roles_required
from flask_login import current_user

from api.mediafile import media_file_api
from api.process import process_api
from api.transcription import transcription_api

from api.blueprint import api

from models import FileStatus

import os, json, time, datetime

# Internal routes only, for server purpose
@api.route('/internal/files', methods = ['GET', 'OPTIONS'])
@auth_token_required
@roles_required('server')
def internal_get_files():

    status = request.args.get('status')

    if(request.args.get('status') is not None):
        files = media_file_api.get_files_by_status(status)
    else:
        files = []

    return make_response(json.dumps([f.to_dict() for f in files]), 200, {'Content-Type': 'application/json' })


@api.route('/internal/files/<int:file_id>', methods = ['GET', 'OPTIONS'])
@auth_token_required
@roles_required('server')
def internal_get_file(file_id):

    file = media_file_api.get_file_by_id(file_id)

    if file is None:
        abort(404)

    return jsonify( file.to_dict() )

@api.route('/internal/files/<int:file_id>', methods=['PUT'])
@auth_token_required
@roles_required('server')
def update_file(file_id):
    file = media_file_api.get_file_by_id(file_id)

    if(file is None):
        abort(404)

    jsonContent = json.loads(request.data.decode('utf-8'))

    if('status' in jsonContent and jsonContent['status'] == FileStatus.Deleted):
        status = jsonContent['status']
        file = media_file_api.mark_file_as_deleted(file)

    return jsonify( file.to_dict() )

@api.route('/internal/processes', methods=['GET'])
@auth_token_required
@roles_required('server')
def get_processes_to_decode():

    if(request.args.get('type') is None):
        processes = process_api.get_pending_decoding_processes()
    else:
        processes = process_api.get_processes_by_type(request.args.get('type'))

    processes_list = [p.to_dict() for p in processes]

    return make_response(json.dumps(processes_list), 200, {'Content-Type': 'application/json' })

@api.route('/internal/processes/<int:process_id>', methods=['PUT'])
@auth_token_required
@roles_required('server')
def update_process(process_id):
    process = process_api.get_process_by_id(process_id)

    if(process is None):
        abort(404)

    jsonContent = json.loads(request.data.decode('utf-8'))

    if('duration' in jsonContent and jsonContent['duration'] != "0"):
        duration = str(jsonContent['duration'])
        d = time.strptime(duration, '%H:%M:%S.%f')
        duration = datetime.timedelta(hours=d.tm_hour,minutes=d.tm_min,seconds=d.tm_sec).total_seconds()
        print("Duration is : {duration}".format(duration=duration))
    else:
        duration = None

    if('progress' in jsonContent):
        progress = jsonContent['progress']
    else:
        progress = None

    if('status' in jsonContent):
        status = jsonContent['status']
    else:
        status = None

    updated_process = process_api.update_process(
            process, status, progress, duration)

    return jsonify( updated_process.to_dict() )


@api.route('/internal/download/<int:file_id>', methods=['GET'])
@auth_token_required
@roles_required('server')
def download_file(file_id):

    if(request.args.get('type') is None):
        file = media_file_api.get_file_by_id(file_id)
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], file.get_file_path())
        if(file is None or not os.path.exists(path)):
            abort(404)

        return send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], file.get_file_path()), mimetype='audio/wav')
    elif(request.args.get('type') == 'transcription_ref'):

        transcription = transcription_api.get_transcription_by_id(file_id)
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], transcription.get_ref_path())

        if(transcription is None or not os.path.exists(path)):
            abort(404)

        return send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], transcription.get_ref_path()), mimetype='text/plain')
    elif(request.args.get('type') == 'transcription_auto'):
        transcription = transcription_api.get_transcription_by_id(file_id)
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], transcription.get_auto_path())
        if(transcription is None or not os.path.exists(path)):
            abort(404)

        return send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], transcription.get_auto_path()), mimetype='text/plain')
    else:
        abort(404)

@api.route('/internal/transcriptions/<int:transcription_id>', methods=['POST'])
@auth_token_required
@roles_required('server')
def modify_transcription(transcription_id):

    transcription = transcription_api.get_transcription_by_id(transcription_id)

    if transcription is None:
        abort(404)

    file = request.files['file']

    (status, filename) = transcription_api.store_aligned_file(file, transcription.user_id, transcription)

    if(status == FileStatus.Success):
        return jsonify({"status" : FileStatus.Success, "transcription" : transcription.to_dict() })
    else:
        return make_response(jsonify( { 'error': 'They were an error during the upload. Please contact the administrator.' } ), 500)
