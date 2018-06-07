#!/usr/bin/env python3
import os, sys, re
from collections import OrderedDict
from flask_script import Manager, prompt_bool, prompt, prompt_pass
from flask_security import registerable
from flask_migrate import Migrate, MigrateCommand

from core import db
from factory import create_app
from fixtures import load_all_fixtures
from voxolab.models import DecodeStatus, ProcessType
from models import AsrModel
from models import User
from models import Process
from sqlalchemy import or_
from math import log, exp
from api.process import process_api

sys.path.append(os.path.join(os.path.dirname(__file__)))

app = create_app()

manager = Manager(app)

migrate = Migrate(app, db)

manager.add_command('db', MigrateCommand)

@manager.command
def dropdb():
    "Clear the existing database (drop_all)"

    if prompt_bool(
        "Are you sure you want to lose all your data"):
        db.drop_all()

@manager.command
def initdb():
    "Clear the existing database and create a fresh one (drop_all && create_all)"

    if prompt_bool(
        "Are you sure you want to lose all your data"):
        db.drop_all()
        db.create_all()

    load_all_fixtures(db, app)
    db.session.commit()

@manager.command
def gettoken(email=None):
    "Get token for an user."

    if not email:
        email = prompt("Please enter the email of the user")

    user = User.query.filter_by(email = email).one()

    print(user.get_auth_token())

@manager.command
def createuser(email=None):
    "Add a new user to the database"

    if not email:
        email = prompt("Please enter the email of the new user")

    while (not is_email_valid(email)):
        email = prompt("Please enter the email of the new user")

    password = prompt_pass("Please enter the password")
    password2 = prompt_pass("Please enter the password again")

    while(password != password2):
        print("Passwords are different, please enter the 2 passwords again.", file=sys.stderr)
        password = prompt_pass("Please enter the password")
        password2 = prompt_pass("Please enter the password again")

    #credit = prompt("Please enter the credit (number of hours), -1 for no limit")
    credit = -1

    french_model = AsrModel.query.filter_by(name='french.studio.fr_FR').first()
    english_model = AsrModel.query.filter_by(name='english.studio').first()

    models = []

    if french_model:
        models.append(french_model)

    if english_model:
        models.append(english_model)
    
    registerable.register_user(
            email=email,
            password=password,
            credit=credit,
            asr_models=models)

    db.session.commit()

    print("User '{user}' created successfully!".format(user=email))

def is_email_valid(email):
    nb_email = db.session.query(User.id).filter_by(email=email).count()

    if(nb_email):
        print("User already in database. Please choose another email.", file=sys.stderr)
        return False
    if (not re.match(r"[^@]+@[^@]+\.[^@]+", email)):
        print("Invalid email address.", file=sys.stderr)
        return False

    return True


@manager.command
def monthly_report():

    durations = process_api.get_report()

    #Formule: (1/(exp(0.47*ln(HEURES))))*100
    for email in OrderedDict(sorted(durations.items(), key=lambda t: t[0])):
        print("{}".format(email))
        for year in OrderedDict(sorted(durations[email].items(), key=lambda t: t[0])):
            for month in OrderedDict(sorted(durations[email][year].items(), key=lambda t: t[0])):
                duration = durations[email][year][month]
                price_per_hour = (1/(exp(0.47*log(duration/3600))))*100
                price = price_per_hour*(duration/3600)
                print("  {}/{}\t{:.2f} heures\t\t{:.2f} euros/heure\t\t{:.2f} euros".format(month, year, duration/3600, price_per_hour, price))


    return True

if __name__ == "__main__":
    manager.run()

