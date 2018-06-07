# Requirements 

## Python

### Version

This project is using Python3. Se be sure that it's available on your system.

### Pip

Pip is a python dependency manager. Be sure to [install it first](https://pip.pypa.io/en/stable/installing/).

### Virtualenv

Once you've installed pip, you will need to work inside a virtualenv. A virtualenv is a convenient way to isolate your python packages. If you don't use a virtualenv, all the python libraries required will be installed system wide.

Install virtualenv:

    pip install --user virtualenv

In the project directory create the virtualenv (here we will name it `env`):

    virtualenv env

If `python 3` is not the default python version on your system, you may have to specify you python 3 binary to virtualenv:

    virtualenv --python=/usr/bin/python3 env

Then activate the environment before launching any python command. You will need to do that each time you want to work on the project:

    . ./env/bin/activate

Your prompt should be modified and should contain something like (env).

### Dependencies

All the project dependencies are managed using pip. Once you've activated your virtualenv, type:

    pip install -r requirements.txt

_Note:_ If you are using Debian/Ubuntu, be sure to have the `python3-dev` package installed or the installation will fail with errors like: `fatal error: Python.h: No such file or directory`.

You're ready to go!

# Running the webapp

First be sure to activate your virtalenv using:

    . ./env/bin/activate

The first time (and only the first time), you will need to first bootstrap your database:

    ./manage.py initdb

Then you just have to launch the following command and your server should be running on http://127.0.0.1:5000/:

    ./manage.py runserver

If you want to use a real webserver like `gunicorn`, just use the `wsgy_dev.py` file provided:

    gunicorn webapp.wsgi_dev:application

Activate virtualenv and then

    ./manage.py runserver



# Run tests

If you want to launch the test suite only once, run:

    py.test tests

If you want to launch only one test file, use the command below:

    py.test tests/test_mediafileapi.py

If you want to launch only one test in a test file:

    py.test -s tests/test_mediafileapi.py::MediaFileApiTestCase::test_file_upload_multi_part_fail

# Generate documentation

You will need [ApiDocJs](http://apidocjs.com/) to generate the documentation. From the project root type:

    apidoc -i api -o docs
    
To deploy it for example you can do:

    rsync -avz docs/ voxolab@voxolab.com:/home/voxolab/www/docs/

# Miscellanous

## curl upload

    curl -i -F file=@lcp_q_gov.wav http://localhost:5000/api/v1.0/files

## Test file conversion

curl 'https://demo.voxolab.com/api/v1.1/transcriptions/convert/1487063813.12' -i \
    -F in_xml_file=@/home/vjousse/Downloads/1487063813_12_in_07824d1f_5114_438c_a18b_75c689135c0a.v2.xml \
    -F out_xml_file=@/home/vjousse/Downloads/1487063813_12_out_b6a0eb2d_c7fe_41b7_b744_d00263b6611c.v2.xml \
    -H 'Authentication-Token: WyI0IiwiNzVlNDczYTU0YTc5YzkwYTQzODBiYzAxZDkyMzBmZjMiXQ.C4TJhQ.UpcQSuHk_N9j02CC1tCcRnWdB4Q'

REST Api auth with Flask: http://blog.miguelgrinberg.com/post/restful-authentication-with-flask

Install git requirment from PIP:

    pip install git+ssh://git@bitbucket.org/vjousse/voxo-lib.git


Interesting links

- http://download.gna.org/gaupol/doc/api/aeidon.html#module-aeidon
- http://trac.ffmpeg.org/wiki/How%20to%20convert%20subtitle%20from%20SRT%20to%20ASS%20format
- http://blog.miguelgrinberg.com/post/designing-a-restful-api-with-python-and-flask
- https://github.com/yanncoupin/stl2srt
