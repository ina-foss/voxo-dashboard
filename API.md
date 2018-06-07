# Overview

## Authentication

All the calls to the API need an authentication token. You can have this token on the profile page of your dashboard, it's called the API Key. The default address is: [https://dashboard.voxolab.com/#/account](https://dashboard.voxolab.com/#/account).

Once you have this token, you will need to provide it with each call you make to the API. You can provide it as a parameter of your query using `auth_token=`, or as a special header named `Authentication-Token`.

Example as a query parameter:

    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?auth_token=WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28&format=xml" 

Example as a special request header:

    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?format=xml" 
      -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

## Decoding a file with studio quality and french language (short version)

Upload the file and start the transcription:

    curl 'https://dashboard.voxolab.com/api/v1.1/files' -i 
       -X POST 
       -F file=@lcp_q_gov.wav 
       -F content='{"lang": "fr", "quality":"studio"}' 
       -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

Download the file (the id is always the one returned by the first call):

    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?format=xml" 
      -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

The format can be xml, srt or ctm. You will know that the transcription is finished when this call will not return a 404 response anymore.

## Decoding a file with phone quality and french language (short version)

Upload the file and start the transcription:


    curl 'https://dashboard.voxolab.com/api/v1.1/files' -i 
       -X POST 
       -F file=@lcp_q_gov.wav 
       -F content='{"lang": "fr", "quality":"phone"}' 
       -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

Download the file (the id is always the one returned by the first call):

    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?format=xml" 
      -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

The format can be xml, srt or ctm. You will know that the transcription is finished when this call will not return a 404 response anymore.

# Decoding a file (detailed version)

## Upload a file and start the transcription

Start by [uploading a file and start the transcription](index.html#api-Files-UploadFile).

    curl 'https://dashboard.voxolab.com/api/v1.1/files' -i 
       -X POST 
       -F file=@lcp_q_gov.wav 
       -F content='{"lang": "fr", "quality":"studio"}' 
       -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


If you want to use phone quality, just replace "studio" with "phone" in the content field. If you want to start the transcription using the english models, replace "fr" with "en". Thcontent field must be valid JSON.

## Follow the progress / status

Get the process object by using the [corresponding API call](index.html#api-Transcriptions-GetProcess). The id that you need to provide is the process id, the one returned by the call "Start a transcription". As a response, you will get something along the lines of:

    {
        "duration": null,
        "file_id": 3,
        "file_name": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
        "id": 12,
        "progress": 0,
        "status": "Queued",
        "status_id": 1,
        "transcription_auto_name": null,
        "transcription_id": null,
        "transcription_ref_name": null,
        "type": "Full transcription"
    }

To get the progress of your transcription you will of course need to check the `progress` field.

## Download the transcription

The id is always the one returned by the first call after uploading your file.

    curl "https://dashboard.voxolab.com/api/v1.1/files/3/transcription?format=xml" 
      -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

The format can be xml, srt or ctm. You will know that the transcription is finished when this call will not return a 404 response anymore.

# Aligning a file

Let's say that you already have the transcription of an audio document done by a human. The only problem is that you can't create subtitles with it because you have no time information about the words. We've got the solution.

First, you need to transcribe your document using the API in order to get the XML transcription. Then, you will need to upload the automatic transcription (.xml format) and the "reference/corrected" transcription (.txt format) to the server.

## Upload the reference and the transcription files

Sending the files:

    curl -i "https://dashboard.voxolab.com/api/v1.1/transcriptions"
        -F auto_file=@transcription.xml 
        -F ref_file=@transcription.txt 
        -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

The response:

    HTTP/1.0 200 OK
    Content-Type: application/json

    {
        "status": 1,
        "transcription": {
            "aligned_filename": null,
            "auto_filename": "2_auto_transcription.xml",
            "id": 2,
            "ref_filename": "2_ref_transcription.txt",
            "user_id": 1
        }
    } 

## Start the alignment process

Starting the process (the id is the transcription id received above):

    curl "https://dashboard.voxolab.com/api/v1.1/processes" 
        -X POST 
        -d '{"id":2,"type":"align"}' 
        -H "Content-Type:application/json"
        -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

The response:

    HTTP/1.0 200 OK
    Content-Type: application/json

    {
        "duration": null,
        "file_id": null,
        "file_name": null,
        "id": 9,
        "progress": 0,
        "status": "Queued",
        "transcription_auto_name": "2_auto_transcription.xml",
        "transcription_id": 2,
        "transcription_ref_name": "2_ref_transcription.txt",
        "type": "Transcription alignment"
    }

## Download the aligned file

The id is the transcription one received after uploading the files.
    
    curl "https://dashboard.voxolab.com/api/v1.1/download/transcription/2"
        -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'
