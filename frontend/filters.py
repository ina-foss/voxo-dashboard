from models import FileStatus
from flask_babel import format_datetime
from hurry.filesize import size
from flask import current_app

def datetime_filter(value, format='medium'):
    if format == 'full':
        format="EEEE, d. MMMM y 'at' HH:mm"
    elif format == 'medium':
        format="EE dd.MM.y HH:mm"
    return format_datetime(value, format)

def role_filter(value, format='medium'):
    if value.has_role(current_app.config['VOXO_ROLE_ADMIN']):
        return 'Admin'
    else:
        return 'User'

def human_size_filter(value):
    return size(value)

def upload_status_filter(value):
    if(value == FileStatus.Success):
        return "Uploaded"
    else:
        return "Error"
