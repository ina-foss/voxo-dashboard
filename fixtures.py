from flask_security import registerable, SQLAlchemyUserDatastore
from voxolab.models import DecodeStatus, ProcessType, FileStatus
from models import AsrModel, User, Role, MediaFile, Process, Transcription

def load_all_fixtures(db, app):

    user_datastore = SQLAlchemyUserDatastore(db, User, Role)

    # Load default fixtures
    role = user_datastore.create_role(name=app.config['VOXO_ROLE_USER'], description='User role')
    admin_role = user_datastore.create_role(name=app.config['VOXO_ROLE_ADMIN'], description='Admin role')
    server_role = user_datastore.create_role(name=app.config['VOXO_ROLE_SERVER'], description='Server role')

    user_vjousse = registerable.register_user(email='vincent@jousse.org', password='rire avec les robots')
    user_datastore.add_role_to_user(user_vjousse, role)

    print("{user} with token {token} created.".format(user=user_vjousse.email, token=user_vjousse.get_auth_token()))

    user = registerable.register_user(email='admin@voxolab.com', password='admin')
    user_datastore.add_role_to_user(user, admin_role)
    user_datastore.add_role_to_user(user, role)

    print("{user} with token {token} created.".format(user=user.email, token=user.get_auth_token()))

    server = registerable.register_user(email='server@voxolab.com', password='server')
    user_datastore.add_role_to_user(server, server_role)

    print("{user} with token {token} created.".format(user=server.email, token=server.get_auth_token()))

    asr_model_french = AsrModel(
        name="french.studio.fr_FR",
        description="General purpose french model")

    asr_model_french.users.append(user_vjousse)

    db.session.add(asr_model_french)
    db.session.flush()

    asr_model_english = AsrModel(
        name="english.studio",
        description="General purpose english model")

    asr_model_english.users.append(user_vjousse)

    db.session.add(asr_model_english)
    db.session.flush()

    
    media_file = MediaFile(
            filename='fixture_file.wav', 
            status = FileStatus.Success, 
            user_id = user_vjousse.id,
            size = 2500,
            generated_filename = 'fixture_file_UUID.wav',
            duration = 70
            )

    db.session.add(media_file)
    db.session.flush()

    process = Process(
            file_id=media_file.id, 
            status = DecodeStatus.Queued, 
            )

    db.session.add(process)
    db.session.flush()

    transcription = Transcription(
            auto_filename='transcription.xml', 
            ref_filename='transcription.txt', 
            user_id = user_vjousse.id,
            )

    db.session.add(transcription)
    db.session.flush()

    process = Process(
            file_id=media_file.id, 
            status = DecodeStatus.Queued, 
            type = ProcessType.TranscriptionAlignment,
            transcription_id = transcription.id
            )

    db.session.add(process)
    db.session.flush()



    db.session.commit()
