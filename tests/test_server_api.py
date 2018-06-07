from models import DecodeStatus
from voxolab.models import ProcessType
import json
from flask import url_for


def test_modify_process(process, client, server_token):

    rv = client.put(
        url_for('api.update_process', process_id=process.id),
        data=json.dumps({
            "status": DecodeStatus.from_string('Segmentation'),
            "progress": 22}),
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 'Segmentation'
    assert result['progress'] == 22

    rv = client.put(
        url_for('api.update_process', process_id=process.id),
        data=json.dumps({
            "status": DecodeStatus.from_string('Segmentation')
        }),
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 'Segmentation'
    assert result['progress'] == 22


def test_get_internal_processes(
        client, media_file, user_token,
        server_token, admin_token, transcription,
        processes_to_decode):

    # Checking get processes with user token (not allowed)
    rv = client.get(
        url_for('api.get_processes_to_decode'),
        follow_redirects=False,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 302

    # Checking get processes with admin token (not allowed)
    rv = client.get(
        url_for('api.get_processes_to_decode'),
        follow_redirects=False,
        headers=[('Authentication-Token', admin_token)])

    assert rv.status_code == 302

    # Checking get processes with server token (allowed)
    rv = client.get(
        url_for('api.get_processes_to_decode'),
        follow_redirects=False,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200
    result = json.loads(rv.data.decode("utf-8"))

    print(result)

    assert len(result) == 2
    assert media_file.id == result[0]['file_id']
    assert ProcessType.to_dict()[ProcessType.FullTranscription] == \
        result[0]['type']

    rv = client.get(
        url_for('api.get_processes_to_decode') + "?type={}"
        .format(ProcessType.TranscriptionAlignment),
        follow_redirects=False,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200
    result = json.loads(rv.data.decode("utf-8"))

    assert len(result) == 1
    assert result[0]['transcription_id'] == transcription.id
    assert ProcessType.to_dict()[ProcessType.TranscriptionAlignment] == \
        result[0]['type']
