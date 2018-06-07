from models import AsrModel

class AsrModelApi:

    def __init__(self, db = None):
        self.init_defaults(db)

    def init_defaults(self, db):
        self.db = db

    def get_asr_model_by_id(self, asr_model_id):
        return AsrModel.query.filter_by(id=asr_model_id).first()

    def get_asr_model_by_name(self, asr_model_name):
        return AsrModel.query.filter_by(name=asr_model_name).first()

asr_model_api = AsrModelApi()
