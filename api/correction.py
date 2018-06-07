import json, os, re, sys

from models import Correction
from api.transcription import transcription_api

class CorrectionApi:

    def __init__(self, db = None):
        self.init_defaults(db)

    def init_defaults(self, db):
        self.db = db

    def add_correction(self, content, file_id, format):
        correction = Correction(
                content=content,
                file_id=file_id, 
                format=format)

        self.db.session.add(correction)
        self.db.session.flush()
        self.db.session.commit()

        return correction

    def update_correction_content(self, correction, content):
        correction.content=self.clean_html_otr(content)
        self.db.session.commit()
        return correction

    def update_correction(self, correction, **kwargs):
        for key, value in kwargs.items():
            setattr(correction, key, value)

        self.db.session.commit()

        return correction

    def get_or_create_correction_for_file(self, file):

        correction = self.find_correction_by_file_id(file.id)

        if correction:
            return correction

        filepath = transcription_api.get_transcription_file_path(file, 'otr')

        if(not os.path.exists(filepath)):
            # Generate the otr file
            if(transcription_api.convert_xml_to_otr(file)):
                filepath = transcription_api.get_transcription_file_path(file, 'otr')

        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data=json.load(f)
                #print(data)
                correction = self.add_correction(data['text'], file.id, 'otr')

                return correction

        return None

    def find_correction_by_file_id(self, file_id):
        return Correction.query.filter_by(file_id=file_id).first()

    def find_correction_by_id(self, id):
        return Correction.query.get(id)

    def clean_html_otr(self, html):
        return re.sub(r'span class="word[^"]*"', 'span class="word"', html)


correction_api = CorrectionApi()
