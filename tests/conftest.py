import glob
import os
import pytest

from flask.ext.security import registerable, SQLAlchemyUserDatastore
from factory import create_app
from core import db
from models import Correction, MediaFile, Process, \
        Transcription, User, Role, AsrModel
from voxolab.models import FileStatus, DecodeStatus, ProcessType
from shutil import rmtree


@pytest.fixture()
def app():
    app = create_app('config_test.py')
    return app


@pytest.yield_fixture(autouse=True)
def cleanup(app):
    yield

    user_dir = os.path.join(app.config['UPLOAD_FOLDER'], '1')
    for item in os.listdir(user_dir):
        folder = os.path.join(user_dir, item)
        if os.path.isdir(folder) and \
                "lcp_q_gov" not in item and \
                "transcriptions" not in item:
            rmtree(folder)

        if os.path.isdir(folder) and \
                "lcp_q_gov" in item:
            audio_files = glob.glob(folder + "/*_audio.wav")
            for audio_file in audio_files:
                os.remove(os.path.join(folder, audio_file))

    remove_if_exists(
        "{}/1/transcriptions/1_aligned_test_result.txt"
        .format(app.config['UPLOAD_FOLDER']))

    remove_if_exists(
        "{}/1/transcriptions/1_auto_test.xml"
        .format(app.config['UPLOAD_FOLDER']))

    remove_if_exists(
        "{}/1/transcriptions/1_ref_test.txt"
        .format(app.config['UPLOAD_FOLDER']))

    db.session.remove()


def remove_if_exists(filepath):
    if(os.path.isfile(filepath)):
        os.remove(filepath)


@pytest.yield_fixture()
def correction(app, media_file):
    correction = Correction(
        content="test content",
        file_id=media_file.id,
        format="html")

    db.session.add(correction)
    db.session.flush()

    yield(correction)

    db.session.remove()


@pytest.yield_fixture()
def transcription(app, users):

    transcription = Transcription(
            auto_filename='transcription.xml',
            ref_filename='transcription.txt',
            user_id=users['user'].id,
            )

    db.session.add(transcription)
    db.session.flush()

    yield(transcription)

    db.session.remove()


@pytest.yield_fixture()
def processes_to_decode(app, media_file, transcription):

    processes = []

    process = Process(
            file_id=media_file.id,
            type=ProcessType.FullTranscription,
            status=DecodeStatus.Queued)

    db.session.add(process)
    db.session.flush()

    processes.append(process)

    process = Process(
            file_id=media_file.id,
            type=ProcessType.FullTranscription,
            status=DecodeStatus.Queued)

    db.session.add(process)
    db.session.flush()

    processes.append(process)

    process = Process(
            transcription_id=transcription.id,
            type=ProcessType.TranscriptionAlignment,
            status=DecodeStatus.Queued)

    db.session.add(process)
    db.session.flush()

    processes.append(process)

    yield(processes)

    db.session.remove()


@pytest.yield_fixture()
def process(app, media_file, processes_to_decode):
    yield(processes_to_decode[0])


@pytest.yield_fixture()
def finished_process(app, media_file):

    process = Process(
            file_id=media_file.id,
            type=ProcessType.FullTranscription,
            status=DecodeStatus.Finished)

    db.session.add(process)
    db.session.flush()

    yield(process)

    db.session.remove()


@pytest.fixture()
def user_datastore(app):

    db.session.remove()
    db.drop_all()
    db.create_all()
    db.session.commit()

    return SQLAlchemyUserDatastore(db, User, Role)


@pytest.yield_fixture()
def users(app, user_datastore):
    v = {}

    role = user_datastore.create_role(
        name=app.config['VOXO_ROLE_USER'],
        description='User role')

    admin_role = user_datastore.create_role(
        name=app.config['VOXO_ROLE_ADMIN'],
        description='Admin role')

    server_role = user_datastore.create_role(
        name=app.config['VOXO_ROLE_SERVER'],
        description='Server role')

    v['user'] = registerable.register_user(
        email='vjousse@voxolab.com',
        password='test')

    user_datastore.add_role_to_user(v['user'], role)

    v['user_test'] = registerable.register_user(
        email='vjoussetest@voxolab.com',
        password='test')

    user_datastore.add_role_to_user(v['user'], role)

    v['admin'] = registerable.register_user(
        email='admin@voxolab.com',
        password='admin')

    user_datastore.add_role_to_user(v['admin'], admin_role)

    v['server'] = registerable.register_user(
        email='server@voxolab.com',
        password='server')

    user_datastore.add_role_to_user(v['server'], server_role)

    db.session.flush()

    yield(v)

    db.session.remove()


@pytest.yield_fixture()
def asr_models(app, users):

    v = {}

    v['asr_model_french'] = AsrModel(
        name="french.studio.fr_FR",
        description="General purpose french model")

    v['asr_model_french'].users.append(users['user'])
    v['asr_model_french'].users.append(users['user_test'])

    db.session.add(v['asr_model_french'])
    db.session.flush()

    v['asr_model_english'] = AsrModel(
        name="english.studio",
        description="General purpose english model")

    v['asr_model_english'].users.append(users['user'])

    db.session.add(v['asr_model_english'])

    db.session.flush()

    yield(v)

    db.session.remove()


@pytest.yield_fixture()
def media_file(media_files):

    yield(media_files[0])


@pytest.yield_fixture()
def user_token(users):
    yield(users['user'].get_auth_token())


@pytest.yield_fixture()
def server_token(users):
    yield(users['server'].get_auth_token())


@pytest.yield_fixture()
def admin_token(users):
    yield(users['admin'].get_auth_token())


@pytest.yield_fixture()
def media_files(app, users):

    files = []

    media_file = MediaFile(
        filename="lcp_q_gov.wav",
        generated_filename="lcp_q_gov_fd2f55e4_a5a4_4c52"
                           "_b71c_102d553ca201.wav",
        status=FileStatus.Success,
        user_id=users['user'].id,
        size=24,
        duration=40)

    db.session.add(media_file)
    db.session.flush()

    files.append(media_file)

    media_file = MediaFile(
        filename="another_file.wav",
        generated_filename="another_file_fd2f55e4_a5a4_"
                           "4c52_b71c_102d553ca201.wav",
        status=FileStatus.Success,
        user_id=users['user'].id,
        size=124,
        duration=200)

    db.session.add(media_file)
    db.session.flush()

    files.append(media_file)

    media_file = MediaFile(
        filename="another_file_again.wav",
        generated_filename="another_file_again_fd2f55e4_a5a4"
                           "_4c52_b71c_102d553ca201.wav",
        status=FileStatus.Success,
        user_id=users['user'].id,
        size=124,
        duration=200)

    db.session.add(media_file)
    db.session.flush()

    files.append(media_file)

    yield(files)

    db.session.remove()


def loadFixtures(v):

    role = v['user_datastore'].create_role(
        name=v['app'].config['VOXO_ROLE_USER'],
        description='User role')

    admin_role = v['user_datastore'].create_role(
        name=v['app'].config['VOXO_ROLE_ADMIN'],
        description='Admin role')

    server_role = v['user_datastore'].create_role(
        name=v['app'].config['VOXO_ROLE_SERVER'],
        description='Server role')

    v['user'] = registerable.register_user(
        email='vjousse@voxolab.com', password='test')

    v['user_test'] = registerable.register_user(
        email='vjoussetest@voxolab.com', password='test')

    v['user_datastore'].add_role_to_user(v['user'], role)

    v['admin'] = registerable.register_user(
        email='admin@voxolab.com', password='admin')

    v['user_datastore'].add_role_to_user(
        v['admin'], admin_role)

    v['server'] = registerable.register_user(
        email='server@voxolab.com', password='server')

    v['user_datastore'].add_role_to_user(
        v['server'], server_role)

    db.session.flush()

    v['media_file'] = MediaFile(
        filename="test.test",
        generated_filename="lcp_q_gov_fd2f55e4_a5a4_4c52"
                           "_b71c_102d553ca201.wav",
        status=FileStatus.Success,
        user_id=v['user'].id,
        size=24,
        duration=40)

    db.session.add(v['media_file'])
    db.session.flush()

    v['media_file_delete'] = MediaFile(
        filename="delete.test",
        generated_filename="delete_test.wav",
        status=FileStatus.Success,
        user_id=v['user'].id,
        size=34,
        duration=60)

    db.session.add(v['media_file_delete'])
    db.session.flush()

    v['process'] = Process(
            file_id=v['media_file'].id,
            type=ProcessType.FullTranscription,
            status=DecodeStatus.Queued)

    db.session.add(v['process'])

    v['finished_process'] = Process(
            file_id=v['media_file'].id,
            type=ProcessType.FullTranscription,
            status=DecodeStatus.Finished)

    db.session.add(v['finished_process'])

    v['process_phone'] = Process(
            file_id=v['media_file'].id,
            type=ProcessType.FullPhoneTranscription,
            status=DecodeStatus.Queued)

    db.session.add(v['process_phone'])
    db.session.flush()

    v['transcription'] = Transcription(
            auto_filename='transcription.xml',
            ref_filename='transcription.txt',
            user_id=v['user'].id,
            )

    db.session.add(v['transcription'])
    db.session.flush()

    v['process_alignment'] = Process(
            transcription_id=v['transcription'].id,
            type=ProcessType.TranscriptionAlignment,
            status=DecodeStatus.Queued)

    db.session.add(v['process_alignment'])
    db.session.flush()

    db.session.commit()

    v['asr_model_french'] = AsrModel(
        name="french.studio.fr_FR",
        description="General purpose french model")

    v['asr_model_french'].users.append(v['user'])
    v['asr_model_french'].users.append(v['user_test'])

    db.session.add(v['asr_model_french'])
    db.session.flush()

    v['asr_model_english'] = AsrModel(
        name="english.studio",
        description="General purpose english model")

    v['asr_model_english'].users.append(v['user'])

    db.session.add(v['asr_model_english'])
    db.session.flush()

    db.session.commit()

    return v
