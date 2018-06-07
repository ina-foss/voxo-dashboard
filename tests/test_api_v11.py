from flask import url_for


def test_urls(users, client):
    token = users['user'].get_auth_token()

    res = client.get(
        url_for('api.get_files'),
        follow_redirects=True,
        headers=[('Authentication-Token', token)]
    )

    assert res.status_code == 200

    res = client.get(
        url_for('api.get_files', api_version='v1.1'),
        follow_redirects=True,
        headers=[('Authentication-Token', token)]
    )

    assert res.status_code == 200
