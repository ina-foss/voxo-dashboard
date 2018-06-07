import json
from flask import url_for, request

def test_get_asr_models_ok(app, users, asr_models, client):

    token = users['user'].get_auth_token()

    res = client.get(url_for('api.list_models', api_version='v1.1'), 
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    results = json.loads(res.data.decode("utf-8"))

    assert len(results) == 2


    token = users['user_test'].get_auth_token()

    res = client.get(url_for('api.list_models', api_version='v1.1'), 
        content_type='application/json',
        headers=[('Authentication-Token', token)])

    assert res.status_code == 200

    results = json.loads(res.data.decode("utf-8"))

    assert len(results) == 1

