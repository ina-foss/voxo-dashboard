import io
import json
import os
from flask import url_for


def test_file_upload(app, client, user_token):

    rv = client.post(
        url_for('api.upload_transcription'),
        data=dict(
            auto_file=(io.BytesIO(b"this is a test"), 'test.xml'),
            ref_file=(io.BytesIO(b"this is a test"), 'test.txt')
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)]
    )

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    file_basename, file_extension = \
        os.path.splitext(result['transcription']['auto_filename'])
    path = "{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'],
        result['transcription']['user_id'],
        'transcriptions',
        file_basename,
        result['transcription']['auto_filename'])

    assert os.path.exists(path)


def test_download_file(client, user_token, server_token):

    rv = client.post(
        url_for('api.upload_transcription'),
        data=dict(
            auto_file=(io.BytesIO(b"this is a xml test"), 'test.xml'),
            ref_file=(io.BytesIO(b"this is a txt test"), 'test.txt')
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    # Test reference/correct transcription download
    rv = client.get(
        url_for(
            'api.download_file',
            file_id=result['transcription']['id'])
        + "?type=transcription_ref",
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200
    assert rv.mimetype == "text/plain"
    assert rv.data.decode("utf-8") == "this is a txt test"

    # Test automatic transcription download
    rv = client.get(
        url_for(
            'api.download_file',
            file_id=result['transcription']['id'])
        + "?type=transcription_auto",
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200
    assert rv.mimetype == "text/plain"
    assert rv.data.decode("utf-8") == "this is a xml test"


def test_aligned_file_upload(
        app, client, server_token, transcription):

    rv = client.post(
        url_for('api.modify_transcription', transcription_id=transcription.id),
        data=dict(
            file=(io.BytesIO(b"this is a test result"), 'test_result.txt')
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', server_token)])

    assert rv.status_code == 200

    result = json.loads(rv.data.decode("utf-8"))

    assert result['status'] == 1

    path = "{}/{}/{}".format(
        app.config['UPLOAD_FOLDER'],
        result['transcription']['user_id'],
        'transcriptions', result['transcription']['aligned_filename'])

    assert os.path.exists(path)


def test_json_conversion_ok(user_token, client):
    callId = "myid"

    rv = client.post(
        url_for('api.convert_transcription', call_unique_id=callId),
        data=dict(
            in_xml_file=(open(
                "tests/fixtures/voyage-in.xml", 'rb'), 'voyage-in.xml'),
            out_xml_file=(open(
                "tests/fixtures/voyage-out.xml", 'rb'), 'voyage-out.xml')
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)]
    )

    result = json.loads(rv.data.decode("utf-8"))

    assert rv.status_code == 200

    assert result['callUniqueId'] == callId


def test_json_conversion_fail_empty_files(user_token, client):
    callId = "myid"

    # Provide only one file
    rv = client.post(
        url_for('api.convert_transcription', call_unique_id=callId),
        data=dict(
            in_xml_file=(io.BytesIO(b""), 'voyage-in.xml'),
            out_xml_file=(io.BytesIO(b""), 'voyage-out.xml'),
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)]
    )

    assert rv.status_code == 400


def test_json_conversion_fail_one_file(user_token, client):
    callId = "myid"

    # Provide only one file
    rv = client.post(
        url_for('api.convert_transcription', call_unique_id=callId),
        data=dict(
            in_xml_file=(open(
                "tests/fixtures/voyage-in.xml", 'rb'), 'voyage-in.xml'),
        ),
        follow_redirects=True,
        headers=[('Authentication-Token', user_token)]
    )

    assert rv.status_code == 400
