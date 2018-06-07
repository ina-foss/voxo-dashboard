import io
import json
import os

from flask import url_for


def test_file_upload_asr_model_name_api_v11(
        app, users, client, asr_models):

    # Test api v1.1
    token = users['user'].get_auth_token()

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{{"asr_model_name": "{model}"}}'
            .format(model=asr_models['asr_model_french'].name),
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 1
    assert result['processes'][0]['type'] == 'Transcription with custom model'
    assert result['processes'][0]['asr_model_name'] == \
        asr_models['asr_model_french'].name


def test_file_upload_bad_asr_model_name_api_v11(
        app, users, client, asr_models):

    # Test api v1.1
    token = users['user'].get_auth_token()

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{"asr_model_name": "INVALID"}',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', token)])

    assert rv.status_code == 400


def test_file_upload_api_v11(app, user_token, client, asr_models):

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{"start": true, "lang": "en", "quality":"phone"}',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 1
    assert result['processes'][0]['type'] == 'Transcription with custom model'
    assert result['processes'][0]['asr_model_name'] == 'english.studio'

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'], result['user_id'],
        file_basename, result['generated_filename'])

    assert os.path.exists(path)

    # Test api v1.1

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{"start": true, "lang": "fr", "quality":"phone"}',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 1
    assert result['processes'][0]['type'] == 'Transcription with custom model'
    assert result['processes'][0]['asr_model_name'] == 'french.studio.fr_FR'

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'], result['user_id'],
        file_basename, result['generated_filename'])

    assert os.path.exists(path)

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{"start": true, "lang": "fr", "quality":"studio"}',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 1
    assert result['processes'][0]['type'] == 'Transcription with custom model'
    assert result['processes'][0]['asr_model_name'] == 'french.studio.fr_FR'

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'], result['user_id'],
        file_basename, result['generated_filename'])

    assert os.path.exists(path)

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '{"start": false, "lang": "fr", "quality":"studio"}',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 0

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'], result['user_id'], file_basename,
        result['generated_filename'])

    assert os.path.exists(path)


# This should not start any process
def test_file_upload_api_v11_fail(app, client, user_token):

    rv = client.post(
        url_for('api.upload_file', api_version='v1.1'),
        content_type='multipart/form-data',
        data={
            'content': '',
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 500

    result = json.loads(rv.data.decode("utf-8"))

    assert 'parse valid json' in result['error']


# This should not start any process
def test_file_upload_api_v1(app, client, user_token):

    rv = client.post(
        url_for('api.upload_file'),
        content_type='multipart/form-data',
        data={
            'file': (io.BytesIO(b"hello there"), 'hello.wav')
        },
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1
    assert len(result['processes']) == 0

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'], result['user_id'],
        file_basename, result['generated_filename'])

    assert os.path.exists(path)
