from api.correction import correction_api

def test_add_correction(app, media_file):

    correction = correction_api.add_correction(
            "test content",
            media_file.id,
            "html")

    assert correction.content == "test content"
    assert correction.file_id == media_file.id

def test_update_correction(app, correction):

    corrected = correction_api.update_correction(
            correction,
            content="test content updated")

    assert corrected.content == "test content updated"

def test_clean_html_otr(app, correction):
    html="""<p><span class="word white" data-start="0">publicains</span> <span class="word white" data-start="0.65">et</span> <span class="word white" data-start="0.78">en</span> <span class="word white" data-start="0.89">2004</span></p><p><span class="word white" data-start="3.2">j'</span><span class="word white" data-start="3.2">allais</span> <span class="word white" data-start="3.6">et</span> <span class="word white" data-start="3.66">vous</span> <span class="word white" data-start="3.85">peut</span> <span class="word highlighted" data-start="4">participer</span></p><p><span class="word" data-start="5.82">au</span> <span class="word" data-start="6.01">débat</span> <span class="word" data-start="6.48">et</span> <span class="word" data-start="6.56">qui</span> <span class="word" data-start="6.75">portait</span> <span class="word" data-start="7.24">notamment</span> <span class="word" data-start="7.81">sur</span> <span class="word" data-start="7.98">la</span> <span class="word" data-start="8.1">laïcité</span> <span class="word" data-start="8.71">à</span> <span class="word" data-start="8.77">l'</span><span class="word" data-start="8.82">école</span></p>"""

    result=correction_api.clean_html_otr(html)

    expected_html="""<p><span class="word" data-start="0">publicains</span> <span class="word" data-start="0.65">et</span> <span class="word" data-start="0.78">en</span> <span class="word" data-start="0.89">2004</span></p><p><span class="word" data-start="3.2">j'</span><span class="word" data-start="3.2">allais</span> <span class="word" data-start="3.6">et</span> <span class="word" data-start="3.66">vous</span> <span class="word" data-start="3.85">peut</span> <span class="word" data-start="4">participer</span></p><p><span class="word" data-start="5.82">au</span> <span class="word" data-start="6.01">débat</span> <span class="word" data-start="6.48">et</span> <span class="word" data-start="6.56">qui</span> <span class="word" data-start="6.75">portait</span> <span class="word" data-start="7.24">notamment</span> <span class="word" data-start="7.81">sur</span> <span class="word" data-start="7.98">la</span> <span class="word" data-start="8.1">laïcité</span> <span class="word" data-start="8.71">à</span> <span class="word" data-start="8.77">l'</span><span class="word" data-start="8.82">école</span></p>"""

    assert result == expected_html 
