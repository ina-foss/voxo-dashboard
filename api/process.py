from models import Process, DecodeStatus, ProcessType, MediaFile, User, AsrModel
from api.mediafile import media_file_api
from api.transcription import transcription_api
from api.asr_model import asr_model_api
from sqlalchemy import or_

class ProcessApi:

    def __init__(self, db = None):
        self.init_defaults(db)

    def init_defaults(self, db):
        self.db = db

    def add_process(self, type, status, file_id=None,
                    transcription_id=None, api_version='v1',
                    asr_model=None):
        process = Process(
                file_id=file_id, 
                transcription_id=transcription_id, 
                type = type, 
                status = status,
                api_version = api_version)

        process.asr_model=asr_model

        self.db.session.add(process)
        self.db.session.flush()
        self.db.session.commit()

        return process

    def add_process_for_user(self, user_id, process_type, status,
                             media_file=None, transcription=None,
                             api_version='v1', asr_model=None):


        if(transcription is not None and transcription.user_id == user_id):
            return self.add_process(
                process_type, status, None, transcription.id,
                api_version=api_version)

        user = User.query.filter_by(id=user_id).first()

        if user is None or asr_model not in user.asr_models:
            return None

        if(media_file is not None and
           media_file.user_id == user_id):

            return self.add_process(
                process_type, status, media_file.id,
                api_version=api_version, asr_model=asr_model)

        return None

    def add_alignment_process_for_user(self, transcription_id, user_id, api_version):
        transcription = transcription_api.get_transcription_by_id(transcription_id)

        if(transcription is not None):
            return self.add_process_for_user(
                user_id, ProcessType.TranscriptionAlignment,
                DecodeStatus.Queued, None, transcription, api_version)
        else:
            return None

    def add_decoding_process_for_user(
            self, file_id, user_id, phone=False,
            english=False, api_version = 'v1', asr_model_name=None):

        media_file = media_file_api.get_file_by_id(file_id)

        # Compatibility with old API
        if asr_model_name is None:
            if english:
                asr_model_name = "english.studio"
            else:
                asr_model_name = "french.studio.fr_FR"

        asr_model = asr_model_api.get_asr_model_by_name(asr_model_name)

        if media_file is None or asr_model is None:
            return None

        return self.add_process_for_user(
            user_id, ProcessType.CustomModelTranscription,
            DecodeStatus.Queued, media_file, api_version=api_version,
            asr_model=asr_model)

    def get_pending_decoding_processes(self):
        return Process.query.filter(or_(Process.type == ProcessType.FullTranscription, Process.type == ProcessType.FullPhoneTranscription, Process.type == ProcessType.FullEnglishTranscription, Process.type == ProcessType.CustomModelTranscription), Process.status == DecodeStatus.Queued).all()

    def get_processes_by_type(self, process_type, status = DecodeStatus.Queued):
        return Process.query.filter_by(type = process_type, status=DecodeStatus.Queued).all()


    def get_process_by_id(self, process_id):
        return Process.query.filter_by(id=process_id).first()

    def get_process_by_id_and_user_id(self, process_id, user_id):
        process = Process.query.filter_by(id=process_id).first()

        if(process and process.file.user_id == user_id):
            return process
        else:
            return None

    def update_process(self, process, status = None, progress = None, duration = None):
        if(status is not None):
            process.status = status

        if(progress is not None):
            process.progress = progress

        if(duration is not None):
            process.duration = duration

        self.db.session.commit()
        return process

    def delete_unfinished_process_by_id_and_user(self, process_id, user_id):
        process = self.get_process_by_id_and_user_id(process_id, user_id)

        if process is None or process.status != DecodeStatus.Queued:
            return False

        self.db.session.delete(process)

        self.db.session.flush()
        self.db.session.commit()

        return True


    def get_report(self, email=None):
        processes = Process.query \
                .join(MediaFile) \
                .join(User) \
                .filter(Process.status==DecodeStatus.Finished) \
                .filter(Process.type!=ProcessType.TranscriptionAlignment) \
                .order_by(Process.created_at.desc())

        if(email is not None):
            processes = processes.filter(User.email==email)

        processes = processes.all()

        durations = {}
        files = {}

        for process in processes:
            file = process.file
            if(file and file.id not in files):
                files[file.id]=file.id
                #print("{} {} {}/{}/{}".format(file.id, file.duration, process.created_at.day, process.created_at.month, process.created_at.year))

                duration = file.duration
                email = file.user.email
                day = process.created_at.day
                month = process.created_at.month
                year = process.created_at.year

                if(email not in durations):
                    durations[email] = {}

                if(year not in durations[email]):
                    durations[email][year] = {}

                if(month not in durations[email][year]):
                    durations[email][year][month] = 0

                durations[email][year][month] += duration

        return durations

process_api = ProcessApi()
