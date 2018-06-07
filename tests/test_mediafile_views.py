import io
import json
import os
from flask import url_for


def test_file_upload(app, user_token, client):

    rv = client.post(url_for('api.upload_file'), data=dict(
        file=(io.BytesIO(b"this is a test"), 'test.wav'),
        ), follow_redirects=True,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'],
        result['user_id'],
        file_basename,
        result['generated_filename']
    )

    assert os.path.exists(path)


def test_long_filname_upload(app, user_token, client):

    rv = client.post(url_for('api.upload_file'), data=dict(
        file=(io.BytesIO(b"this is a test"),
              'orientations_budgetaires_2016_le_departement_main'
              'tient_son_effort_dinvestissemen.wav'),
        ), follow_redirects=True,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    assert len(result['generated_filename']) < 100

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'],
        result['user_id'],
        file_basename,
        result['generated_filename'])

    assert os.path.exists(path)


def test_file_upload_multi_part_fail(app, user_token, client):

    rv = client.post(
            url_for('api.upload_file'),
            buffered=True,
            content_type='multipart/form-data',
            data={
                'content': 'test',
                'file': (io.BytesIO(b"hello there"), 'hello.wav')
            },
            headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 500

    result = json.loads(rv.data.decode("utf-8"))

    assert 'use the version 1.1' in result['error']


def test_file_upload_and_start_process(app, user_token, client):

    data = {
        'file': (io.BytesIO(b"this is a test"), 'test.wav'),
        'start': 'true',
    }

    rv = client.post(
            url_for('api.upload_file'),
            data=data,
            follow_redirects=True,
            headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    file_basename, file_extension = \
        os.path.splitext(result['generated_filename'])

    path = "{}/{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'],
        result['user_id'],
        file_basename,
        result['generated_filename'])

    assert os.path.exists(path)


def test_get_file(client, user_token, media_files):

    rv = client.get(
        url_for('api.get_file', file_id=1),
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['id'] == 1

    rv = client.get(
        url_for('api.get_file', file_id=99),
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 404


def test_download_file(client, user_token, server_token, media_files):

    rv = client.post(
        url_for('api.upload_file'),
        data=dict(
            file=(io.BytesIO(b"this is a test"), 'test.wav'),
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    rv = client.get(
        url_for('api.download_user_file', file_id=result['id']),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    rv = client.get(
        url_for('api.download_file', file_id=result['id']),
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200

    assert rv.mimetype == "audio/wav"


def test_get_otr_transcription(user_token, client, media_files):

    otr_url = "{}?format=otr".format(
        url_for('api.get_transcription', file_id=1))

    rv = client.get(
        otr_url,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200


def test_delete_file(user_token, client, media_files):

    rv = client.delete(
        '/api/files/2',
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    rv = client.get(
        '/api/files/2',
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 404
