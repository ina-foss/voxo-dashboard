from werkzeug.utils import secure_filename
from models import FileStatus, MediaFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc, func
from voxolab.convert import get_duration, anything_to_wav
import traceback

import os
import re
import sys
import uuid
from unidecode import unidecode

_punct_re = re.compile(r'[\t !"#$%&\'()*\-/<=>?@\[\\\]^_`{|},.]+')


class MediaFileApi:

    def __init__(self, db=None, data_dir="uploads/",
                 allowed_extensions=None):
        self.init_defaults(db, data_dir, allowed_extensions)

    def init_defaults(self, db, data_dir, allowed_extensions):
        self.allowed_extensions = allowed_extensions
        self.data_dir = data_dir
        self.db = db

    def slugify(self, text, delim=u'_'):
        """Generates an ASCII-only slug."""

        result = []
        for word in _punct_re.split(text.lower()):
            result.extend(unidecode(word).split())
        return str(delim.join(result))

    def allowed_file(self, filename):
        """Check if the file is allowed using its extension"""

        return '.' in filename and \
            (filename.rsplit('.', 1)[1]).lower() in self.allowed_extensions

    def sanitize_filepath(self, filepath, file_uuid):
        # Replace - by _ due to scripts of the decoder using - as
        # an information separator in filenames
        filepath = secure_filename(filepath)

        filepath, file_extension = os.path.splitext(filepath)
        filename = os.path.basename(filepath)
        dirpath = os.path.dirname(os.path.realpath(filepath))

        return os.path.join(
            dirpath, self.slugify(filename[:55]) + '_' + file_uuid
        ) + file_extension

    def get_files_for_user(self, user_id, page=None, filePerPage=None):
        if(filePerPage is None):
            return self.files_for_user_query(MediaFile.query, user_id) \
                    .order_by(desc(MediaFile.created_at)).all()
        else:
            return self.files_for_user_query(MediaFile.query, user_id) \
                    .order_by(desc(MediaFile.created_at)) \
                    .slice(page*filePerPage, page*filePerPage+filePerPage)

    def get_nb_files_for_user(self, user_id):
        return self.files_for_user_query(
            self.db.session.query(func.count(MediaFile.id)),
            user_id
        ).first()[0]

    def files_for_user_query(self, query, user_id):
        return query.filter_by(user_id=user_id) \
            .filter(MediaFile.status != FileStatus.ToDelete) \
            .filter(MediaFile.status != FileStatus.Deleted)

    def get_files_by_status_and_user_id(self, status, user_id):
        return MediaFile.query.filter_by(user_id=user_id, status=status) \
                .order_by(desc(MediaFile.created_at)).all()

    def get_files_by_status(self, status):
        return MediaFile.query.filter_by(status=status) \
                .order_by(desc(MediaFile.created_at)).all()

    def get_file_by_id(self, file_id):
        return MediaFile.query.filter_by(id=file_id).first()

    def get_file_by_id_and_user_id(self, file_id, user_id):
        return MediaFile.query.filter_by(id=file_id, user_id=user_id) \
                .filter(MediaFile.status != FileStatus.ToDelete) \
                .filter(MediaFile.status != FileStatus.Deleted) \
                .first()

    def mark_file_as_to_delete(self, file, user_id):
        file.status = FileStatus.ToDelete
        self.db.session.commit()

        return file

    def delete_local_files(self, file, user_id, keepFiles=False):
        if(file.status == FileStatus.ToDelete or
           file.status == FileStatus.Deleted):

            # Delete the audio file
            if not keepFiles:
                filename = self.get_file_path_for_user(
                                user_id,
                                file.generated_filename)
                try:
                    os.remove(filename)
                except OSError:
                    pass

            file_basename, file_extension = os.path.splitext(file.generated_filename)
            basepath = os.path.join(self.data_dir, str(user_id), file_basename)

            # Delete the files uploaded by the daemon
            if not keepFiles:
                extensions = ['srt', 'ctm', 'xml', 'vtt', 'scc']
                for extension in extensions:
                    file_to_delete = "{}.{}".format(basepath, extension)
                    try:
                        os.remove(file_to_delete)
                    except OSError:
                        pass

            # Delete the processes in the DB
            # Keep it ! or we are not able to count the decoding time to bill
            #processes = file.processes
            #for process in processes:
            #    self.db.session.delete(process)

            self.db.session.commit()

        return file

    def mark_file_as_deleted(self, file):
        file.status = FileStatus.Deleted
        self.db.session.commit()

        return file


    def store_and_save_uploaded_file(self, file, user_id):
        try:
            if file and self.allowed_file(file.filename):
                file_uuid = str(uuid.uuid4()).replace('-','_')
                filename = self.get_file_path_for_user(user_id, self.sanitize_filepath(file.filename, file_uuid), create=True)
                file.save(filename)
                media_file = self.store_file(secure_filename(file.filename), filename, user_id, FileStatus.Success)
                self.extract_audio(media_file)

                return (FileStatus.Success, media_file)

            return (FileStatus.ExtensionNotAllowed, None)
        except IntegrityError as e:
            print("SQL error while uploading {0} for {1}".format(e, file.filename), file=sys.stderr)
            return (FileStatus.Error, None)
        
        except Exception as e:
            print("Upload error {0} for {1}".format(e, file.filename), file=sys.stderr)
            traceback.print_tb(e.__traceback__)
            return (FileStatus.Error, None)

    def extract_audio(self, file):
        from concurrent.futures import ThreadPoolExecutor

        with ThreadPoolExecutor(max_workers=1) as executor:
            filename = self.get_file_path_for_user(file.user_id, file.generated_filename)
            file_basename, file_extension = os.path.splitext(filename)

            future = executor.submit(anything_to_wav, filename, "{}_audio.wav".format(file_basename))
            return future

    def get_file_path_for_user(self, user_id, file_path, create = False):

        file_basename, file_extension = os.path.splitext(file_path)

        basepath = os.path.join(self.data_dir, str(user_id), os.path.basename(file_basename))

        if(create and not os.path.exists(basepath)):
            os.makedirs(basepath)

        return os.path.join(basepath, os.path.basename(file_path))

    def get_audio_file_path_for_user_and_file(self, user_id, file):
        file_basename, file_extension = os.path.splitext(file.generated_filename)

        basepath = os.path.join(self.data_dir, str(user_id), os.path.basename(file_basename))

        return os.path.join(basepath, file.get_audio_filename())

    def store_file(self, file_path, generated_filename, user_id, status):
        # Save to DB
        (d_time, d_seconds) = get_duration(generated_filename)
        media_file = MediaFile(
                filename=os.path.basename(file_path), 
                status = status, 
                user_id = user_id,
                size = os.path.getsize(generated_filename),
                generated_filename = os.path.basename(generated_filename),
                duration = d_seconds
                )
        self.db.session.add(media_file)
        self.db.session.commit()

        return media_file


media_file_api = MediaFileApi()
