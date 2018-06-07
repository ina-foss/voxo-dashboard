import os
import time
from flask_security import UserMixin, RoleMixin
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy import event
from hurry.filesize import size

from core import db
from voxolab.models import FileStatus, DecodeStatus, ProcessType


# Support for FK in sqlite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

asr_models_users = db.Table('asr_models_users',
    db.Column('asr_model_id', db.Integer, db.ForeignKey('asr_model.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'))
)

class IdMixin(object):
    """
Provides the :attr:`id` primary key column
"""
    #: Database identity for this model, used for foreign key
    #: references from other models
    id = db.Column(db.Integer, primary_key=True)


timestamp_columns = (
    db.Column('created_at', db.DateTime,
              default=datetime.utcnow, nullable=False),
    db.Column('updated_at', db.DateTime,
              default=datetime.utcnow, onupdate=datetime.utcnow,
              nullable=False),
    )


class TimestampMixin(object):
    """
Provides the :attr:`created_at` and :attr:`updated_at` audit timestamps
"""
    #: Timestamp for when this instance was created, in UTC
    created_at = db.Column(db.DateTime, default=datetime.utcnow,
                           nullable=False)
    #: Timestamp for when this instance was last updated (via the app), in UTC
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)


class Role(db.Model, RoleMixin, TimestampMixin, IdMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class User(db.Model, UserMixin, TimestampMixin, IdMixin):
    __tablename__ = 'user'
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

    # Trackable fields for Flask-Security
    last_login_at = db.Column(db.DateTime)
    current_login_at = db.Column(db.DateTime)
    last_login_ip = db.Column(db.String(50))
    current_login_ip = db.Column(db.String(50))
    login_count = db.Column(db.Integer)
    credit = db.Column(db.Integer)

    asr_models = db.relationship(
        "AsrModel",
        secondary=asr_models_users,
        back_populates="users")

    def __repr__(self):
        return "<User {mail}>".format(mail=self.email)


class MediaFile(db.Model, TimestampMixin, IdMixin):
    __tablename__ = 'media_file'
    filename = db.Column(db.String(254), index=True)
    status = db.Column(db.SmallInteger, default=FileStatus.Success)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", backref=db.backref('files'))
    duration = db.Column(db.Integer, nullable=False)

    size = db.Column(db.Integer)
    generated_filename = db.Column(db.String(254), index=True, unique=True)

    def get_file_path(self):
        file_basename, file_extension = \
            os.path.splitext(self.generated_filename)

        return os.path.join(str(self.user_id), file_basename,
                            self.generated_filename)

    def get_audio_filename(self):
        file_basename, file_extension = \
            os.path.splitext(self.generated_filename)

        return "{}_audio.wav".format(file_basename)

    def get_audio_file_path(self):
        file_basename, file_extension = \
            os.path.splitext(self.generated_filename)
        return os.path.join(str(self.user_id), file_basename,
                            "{}_audio.wav".format(file_basename))

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'status': self.status,
            'user_id': self.user_id,
            'size': self.size,
            'size_human': size(self.size),
            'generated_filename': self.generated_filename,
            'created_at': self.created_at.strftime("%d-%m-%Y %H:%M:%S")
            if self.created_at is not None else '',
            'processes': [p.to_dict() for p in self.processes],
            'duration': self.duration,
            'timestamp': int(time.mktime(self.created_at.timetuple()))
            }

    def __repr__(self):
        return "<MediaFile {filename}, {status}>\n{content}".format(
            filename=self.filename,
            status=self.status,
            content=self.to_dict())


class Transcription(db.Model, TimestampMixin, IdMixin):
    __tablename__ = 'transcription'
    auto_filename = db.Column(db.String(254), unique=True)
    ref_filename = db.Column(db.String(254), unique=True)
    aligned_filename = db.Column(db.String(254), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", backref=db.backref('transcriptions'))

    def __repr__(self):
        return "<Transcription for file {file}>".format(file=self.file_id)

    def get_auto_path(self):
        return os.path.join(
            str(self.user_id), 'transcriptions', self.auto_filename)

    def get_ref_path(self):
        return os.path.join(
            str(self.user_id), 'transcriptions', self.ref_filename)

    def get_aligned_path(self):
        return os.path.join(
            str(self.user_id), 'transcriptions', self.aligned_filename)

    def to_dict(self):
        return {
            'id': self.id,
            'auto_filename': self.auto_filename,
            'ref_filename': self.ref_filename,
            'aligned_filename': self.aligned_filename,
            'user_id': self.user_id
            }


class Process(db.Model, TimestampMixin, IdMixin):
    __tablename__ = 'process'

    file_id = db.Column(
        db.Integer, db.ForeignKey('media_file.id'), nullable=True)

    file = db.relationship("MediaFile", backref=db.backref('processes'))

    transcription_id = db.Column(
        db.Integer, db.ForeignKey('transcription.id'), nullable=True)

    transcription = db.relationship(
        "Transcription", backref=db.backref('processes'))

    status = db.Column(db.SmallInteger, default=DecodeStatus.Queued)
    type = db.Column(db.SmallInteger, default=ProcessType.FullTranscription)
    duration = db.Column(db.Integer)
    progress = db.Column(db.Integer, default=0, nullable=False)
    api_version = db.Column(db.String(8), default='v1')
    # ALTER TABLE process ADD COLUMN api_version varchar(8) default 'v1';

    asr_model_id = db.Column(
        db.Integer, db.ForeignKey('asr_model.id'), nullable=True)

    asr_model = db.relationship(
        "AsrModel", backref=db.backref('processes'))

    def __repr__(self):
        return "<Process {id} for file_id {file_id}>".format(
            id=self.id, file_id=self.file_id)

    def to_dict(self):
        return {
            'id': self.id,
            'file_id': (self.file.id if self.file else None),
            'file_name': (self.file.generated_filename if self.file else None),
            'transcription_id': (self.transcription.id
                                 if self.transcription
                                 else None),
            'transcription_ref_name': (self.transcription.ref_filename
                                       if self.transcription
                                       else None),
            'transcription_auto_name': (self.transcription.auto_filename
                                        if self.transcription
                                        else None),
            'status': DecodeStatus.to_dict()[self.status],
            'status_id': self.status,
            'type': ProcessType.to_dict()[self.type],
            'type_id': self.type,
            'duration': self.duration,
            'progress': self.progress,
            'api_version': self.api_version,
            'asr_model_name': (self.asr_model.name
                               if self.asr_model
                               else None),
            }


class Correction(db.Model, TimestampMixin, IdMixin):
    __tablename__ = 'correction'
    content = db.Column(db.Text)
    file_id = db.Column(
        db.Integer, db.ForeignKey('media_file.id'), nullable=False)
    format = db.Column(db.String(5), index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'file_id': self.file_id,
            'format': self.format,
            'created_at': (self.created_at.strftime("%d-%m-%Y %H:%M:%S")
                           if self.created_at is not None
                           else ''),
            'updated_at': (self.updated_at.strftime("%d-%m-%Y %H:%M:%S")
                           if self.updated_at is not None
                           else '')
            }

    def __repr__(self):
        return "<Correction {id}, {format}>\n{content}".format(
            id=self.id, format=self.format, content=self.content)


class AsrModel(db.Model, TimestampMixin, IdMixin):
    __tablename__ = 'asr_model'
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))
    users = db.relationship(
        "User",
        secondary=asr_models_users,
        back_populates="asr_models")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': (self.created_at.strftime("%d-%m-%Y %H:%M:%S")
                           if self.created_at is not None
                           else ''),
            'updated_at': (self.updated_at.strftime("%d-%m-%Y %H:%M:%S")
                           if self.updated_at is not None
                           else '')
            }

    def __repr__(self):
        return "<AsrModel {id}, {name}>\n{description}".format(
            id=self.id, name=self.name, description=self.description)
