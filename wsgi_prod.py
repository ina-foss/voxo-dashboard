import os, sys

PROJECT_DIR = '/home/asr/asr/voxo-dashboard'

activate_this = os.path.join(PROJECT_DIR, 'env', 'bin', 'activate_this.py')
#execfile(activate_this, dict(__file__=activate_this))
exec(compile(open(activate_this, "rb").read(), activate_this, 'exec'), dict(__file__=activate_this))
sys.path.append(PROJECT_DIR)

from factory import create_app

application = create_app()
