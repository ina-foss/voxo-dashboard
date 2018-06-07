var filesUrl = '{{ url_for('api.get_files', api_version='v1.1') }}';
var processUrl = '{{ url_for('api.add_process', api_version='v1.1') }}';
var uploadUrl = '{{ url_for('api.upload_file', api_version='v1.1') }}';
var accountUrl = '{{ url_for('api.account_info', api_version='v1.1') }}';
var logoutUrl = '{{ url_for('security.logout', api_version='v1.1') }}';
var transcriptionUrl = '{{ url_for('api.get_transcription', api_version='v1.1', file_id=-1) }}';
var downloadUrl = '{{ url_for('api.download_user_file', api_version='v1.1', file_id=-1) }}';
var addCorrectionUrl = '{{ url_for('api.add_correction', api_version='v1.1') }}';
var updateCorrectionUrl = '{{ url_for('api.update_correction', api_version='v1.1', correction_id=-1) }}';
var modelsUrl = '{{ url_for('api.list_models', api_version='v1.1') }}';

var authToken = '{{ auth_token }}';
var voxoEditor = {{ editor }};
var voxoEn = {{ english }};

// Default xhr/ajax config
var xhrConfig = function(xhr) {
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.setRequestHeader("Authentication-Token", authToken);
}

