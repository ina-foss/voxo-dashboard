import json
from flask import url_for
from voxolab.models import ProcessType


def test_add_process_with_model_should_be_ok(
        app, users, media_file, client, asr_models):

    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'),
        content_type='application/json',
        data=json.dumps(
            {
                "id": media_file.id,
                "asr_model_name": asr_models["asr_model_french"].name
            }),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['transcription_id'] == None
    assert result['asr_model_name'] == asr_models["asr_model_french"].name
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.CustomModelTranscription]


def test_add_process_with_english_model_should_be_ok(
        app, users, media_file, client, asr_models):

    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'),
        content_type='application/json',
        data=json.dumps(
            {
                "id": media_file.id,
                "asr_model_name": asr_models["asr_model_english"].name
            }),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['transcription_id'] == None
    assert result['asr_model_name'] == asr_models["asr_model_english"].name
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.CustomModelTranscription]

def test_add_process_should_default_to_custom_french(
        app, users, media_file, client, asr_models):

    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps({"id": media_file.id}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['transcription_id'] == None
    assert result['asr_model_name'] == asr_models["asr_model_french"].name
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.CustomModelTranscription]

def test_add_process_should_default_to_custom_english(
        app, users, media_file, client, asr_models):

    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps({"id": media_file.id, 'english': True}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['transcription_id'] == None
    assert result['asr_model_name'] == asr_models["asr_model_english"].name
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.CustomModelTranscription]


def test_add_phone_process_should_default_to_custom_french(
        app, users, media_file, client, asr_models):

    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps({"id": media_file.id, "phone": True}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['transcription_id'] == None
    assert result['asr_model_name'] == asr_models["asr_model_french"].name
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.CustomModelTranscription]
 


def test_add_align_process(app, users, transcription, client):
    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_process', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps(
            {
                "id": transcription.id,
                "type": ProcessType.TranscriptionAlignment
            }),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['transcription_id'] == transcription.id
    assert result['file_id'] == None
    assert result['type'] == \
        ProcessType.to_dict()[ProcessType.TranscriptionAlignment]


def test_get_process(app, users, process, media_file, client):
    token = users['user'].get_auth_token()

    res = client.get(
        url_for('api.get_process',
                api_version='v1.1', 
                process_id=process.id),
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert result['file_id'] == media_file.id
    assert result['id'] == process.id

def test_delete_process(app, users, client, process):
    token = users['user'].get_auth_token()

    res = client.delete(
        url_for('api.delete_process',
                api_version='v1.1', 
                process_id=process.id),
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

def test_delete_finished_process(app, users, client, process, finished_process):
    token = users['user'].get_auth_token()

    res = client.delete(
        url_for('api.delete_process',
                api_version='v1.1', 
                process_id=finished_process.id),
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 404

