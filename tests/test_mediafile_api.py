import os
from api.mediafile import media_file_api


def test_generated_filename(media_file):

    file_basename, file_extension = \
        os.path.splitext(media_file.generated_filename)

    assert media_file.get_file_path() == "{}/{}/{}".format(
            media_file.user_id, file_basename, media_file.generated_filename)


def test_extract_audio(media_file):

    future = media_file_api.extract_audio(media_file)

    # Conversion was ok
    assert future.result() == 0

    filename = media_file_api.get_audio_file_path_for_user_and_file(
        media_file.user_id, media_file)

    assert os.path.isfile(filename)


def test_nb_files_deleted(app, users, media_file):
    user = users['user']
    assert media_file_api.get_nb_files_for_user(user.id) == 3

    media_file_api.mark_file_as_to_delete(media_file, user.id)

    assert media_file_api.get_nb_files_for_user(user.id) == 2
