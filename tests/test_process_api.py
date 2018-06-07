import io
import json
import os
from models import MediaFile, DecodeStatus
from api.process import process_api


def test_decoding_process_for_user(
        app, users, media_file, asr_models):

    # Adding a process for a file owned by the same user should be ok
    process = process_api.add_decoding_process_for_user(
        media_file.id,
        users['user'].id,
        asr_model_name = asr_models['asr_model_french'].name)

    assert process is not None

    # Adding a process for a file not owned by the same user should fail
    process = process_api.add_decoding_process_for_user(media_file.id, 450)
    assert process is None

def test_english_decoding_process_for_user(
        app, users, media_file, asr_models):

    process = process_api.add_decoding_process_for_user(
        media_file.id,
        users['user'].id,
        False,
        False,
        'v1.1',
        asr_model_name = asr_models['asr_model_english'].name)

    assert process is not None
    assert process.asr_model.name == asr_models['asr_model_english'].name

def test_updating_process_for_user(app, process):

        test_process = process_api.update_process(
            process, DecodeStatus.Finished, 25, 99)

        assert test_process.duration == 99
        assert test_process.progress == 25
        assert test_process.status == DecodeStatus.Finished


        test_process = process_api.update_process(
            test_process, DecodeStatus.Error)
        assert test_process.duration == 99
        assert test_process.progress == 25
        assert test_process.status == DecodeStatus.Error

        test_process = process_api.update_process(test_process)
        assert test_process.duration == 99
        assert test_process.progress == 25
        assert test_process.status == DecodeStatus.Error

def test_removing_unfinished_process_for_user(
        app, process, finished_process, users):

    # Deleting an unfinished process for a file owned
    # by the same user should be ok
    success = process_api.delete_unfinished_process_by_id_and_user(
        process.id, users['user'].id)
    assert success


    # Deleting a finished process for a file owned by the same user should fail
    success = process_api.delete_unfinished_process_by_id_and_user(
        finished_process.id, users['user'].id)

    assert not success
