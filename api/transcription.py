from werkzeug.utils import secure_filename
from models import FileStatus, MediaFile, Transcription
from voxolab.xml_to_otr import xml_to_otr 
import sys, os

class TranscriptionApi:

    def __init__(self, db = None, data_dir = "uploads/"):
        self.init_defaults(db, data_dir)

    def init_defaults(self, db, data_dir):
        self.db = db
        self.data_dir = data_dir

    def get_transcription_file_path(self, media_file, trans_format = "srt"):

        basename = os.path.splitext(media_file.generated_filename)[0]
        basepath = os.path.join(self.data_dir, str(media_file.user_id))
        filepath = os.path.join(basepath, basename + "." + trans_format)

        return filepath

    def get_transcription_by_id(self, transcription_id):
        return Transcription.query.filter_by(id=transcription_id).first()


    def store_aligned_file(self, file, user_id, transcription):
        file.filename = "{}_aligned_{}".format(transcription.id, file.filename)

        (status, filename) = self.store_and_save_uploaded_file(file, user_id, 'transcriptions')

        if(status == FileStatus.Success):
            transcription.aligned_filename = os.path.basename(filename)
            self.db.session.commit()
            return (FileStatus.Success, transcription)
        else:
            return (FileStatus.Error, None) 

    def store_and_save_transcription_files(self, auto_file, ref_file, user_id):
        transcription = Transcription(user_id = user_id)
        self.db.session.add(transcription)
        self.db.session.commit()

        auto_file.filename = "{}_auto_{}".format(transcription.id, auto_file.filename)
        ref_file.filename = "{}_ref_{}".format(transcription.id, ref_file.filename)

        (auto_status, auto_filename) = self.store_and_save_uploaded_file(auto_file, user_id, 'transcriptions')
        (ref_status, ref_filename) = self.store_and_save_uploaded_file(ref_file, user_id, 'transcriptions')

        if(auto_status == FileStatus.Success and ref_status == FileStatus.Success):
            transcription.auto_filename = os.path.basename(auto_filename)
            transcription.ref_filename = os.path.basename(ref_filename)
            self.db.session.commit()
            return (FileStatus.Success, transcription)
        else:
            return (FileStatus.Error, None) 

    def store_and_save_transcription_result(self, file, user_id):
        return self.store_and_save_uploaded_file(file, user_id)

    def store_and_save_uploaded_file(self, file, user_id, prefix_dir = None):
        try:
            if file:
                if not prefix_dir:
                    basepath = os.path.join(self.data_dir, str(user_id))
                else:
                    basepath = os.path.join(self.data_dir, str(user_id), prefix_dir)

                if(not os.path.exists(basepath)):
                    os.makedirs(basepath)

                filename = os.path.join(basepath, secure_filename(file.filename))

                file.save(filename)
                return (FileStatus.Success, filename)

            print("Error while uploading {0}. Please provide a file object.".format(file.filename), file=sys.stderr)
            return (FileStatus.Error, None)

        except Exception as e:
            print("Upload error {0} for {1}".format(e, file.filename), file=sys.stderr)
            return (FileStatus.Error, None)

    def convert_xml_to_otr(self, media_file):
        xml_path = self.get_transcription_file_path(media_file, 'v2.xml')
        otr_path = self.get_transcription_file_path(media_file, 'otr')
        try:
            xml_to_otr(xml_path, otr_path, True)
            return True
        except Exception as e:
            print("Conversion to otr error {0} for {1}".format(e, xml_path), file=sys.stderr)
            return False




transcription_api = TranscriptionApi()
