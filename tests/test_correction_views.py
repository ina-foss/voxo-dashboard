import json
from flask import url_for, request

def test_add_correction_view_bad_json(app, users, client):
    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_correction', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps({"id": 1}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 400

    result = json.loads(res.data.decode("utf-8"))

    assert "'content' is a required property" in result['error']

def test_add_correction_view_ok(app, users, media_file, client):
    token = users['user'].get_auth_token()

    res = client.post(url_for('api.add_correction', api_version='v1.1'), 
        content_type='application/json',
        data=json.dumps({"content": "test content", "file_id": media_file.id, "format":"otr"}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert "test content" == result['content']
    assert media_file.id == result['file_id']


def test_update_correction_view_ok(app, users, media_file, correction, client):
    token = users['user'].get_auth_token()

    res = client.put(url_for('api.update_correction', api_version='v1.1', correction_id=correction.id), 
        content_type='application/json',
        data=json.dumps({"content": "test content update", "format":"otr"}),
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert "test content update" == result['content']
    assert media_file.id == result['file_id']
    assert correction.id == result['id']

def test_get_correction_ok(app, users, correction, client):
    token = users['user'].get_auth_token()

    res = client.get(url_for('api.get_correction', api_version='v1.1', correction_id=correction.id), 
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    result = json.loads(res.data.decode("utf-8"))

    assert correction.id == result['id']

