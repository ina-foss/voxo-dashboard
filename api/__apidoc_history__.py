"""
@api {get} /api/files Request a list of files
@apiName GetFiles
@apiVersion 1.0.0
@apiGroup Files
@apiDescription This function returns an Array of file Object. Each file object is described above.
@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/files' 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
 HTTP/1.1 200 OK
Content-Type: application/json

[
 {
  "size": 2217030, 
  "user_id": 1, 
  "created_at": "30-05-2014 22:46:00", 
  "id": 2, 
  "size_human": "2M", 
  "status": 1, 
  "filename": "lcp_q_gov.wav", 
  "generated_filename": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", 
  "duration": 69, 
  "processes": 
    [
      {"type": "Full transcription", "transcription_auto_name": null, "file_name": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", "id": 3, "file_id": 2, "status": "Queued", "transcription_id": null, "duration": 704, "transcription_ref_name": null, "progress": 100}, 
      {"type": "Full transcription", "transcription_auto_name": null, "file_name": "lcp_q_gov_fd1fb9e4_aa38_438e_b169_c8087722b6d3.wav", "id": 4, "file_id": 2, "status": "Queued", "transcription_id": null, "duration": null, "transcription_ref_name": null, "progress": 10}, 
    ]
 }
]
"""

"""
@api {get} /api/files/:file_id/transcription Download transcription result
@apiVersion 1.0.0
@apiName GetTranscription
@apiGroup Transcriptions
@apiDescription Returns the transcription as the body of the response. 4 formats are supported: srt, ctm, xml, vtt.

@apiParam {String} format format of the file to download. Can be <code>srt</code>, <code>ctm</code> or <code>xml</code>.

@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/files/3/transcription?format=xml" 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

"""


"""
@api {post} /api/files Upload a file
@apiVersion 1.0.0
@apiName UploadFile
@apiGroup Files
@apiDescription This function allows you to upload a file to the server.

@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/files' -i
    -X POST
    -F file=@lcp_q_gov.wav 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json

{
  "created_at": "02-06-2014 09:56:26",
  "duration": 69,
  "filename": "lcp_q_gov.wav",
  "generated_filename": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
  "id": 3,
  "processes": [],
  "size": 2217030,
  "size_human": "2M",
  "status": 1,
  "user_id": 1
}
"""

"""
@api {post} /api/transcriptions Upload transcriptions for alignment
@apiVersion 1.0.0
@apiName AlignFile
@apiGroup Align
@apiDescription This function allows you to upload files on the server to start an alignment. You need an xml file of the decoding and a .txt file containing the text to align.

@apiExample CURL example:
    curl 'https://dashboard.voxolab.com/api/transcriptions' -i 
    -F auto_file=@transcription.xml 
    -F ref_file=@transcription.txt 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):

HTTP/1.1 100 Continue

HTTP/1.1 200 OK
Server: nginx/1.4.6 (Ubuntu)
Date: Wed, 21 Jan 2015 15:38:44 GMT
Content-Type: application/json
Content-Length: 240
Connection: keep-alive
Set-Cookie: session=eyJfaWQiOiJhZmRiN2UwZDk4YmM4Y2U5N2M4OGNjY2FhZDRlNTU3OCJ9.B6FZhA.kfjQFjfXSuwbilC4ZjROgHUXdzA; HttpOnly; Path=/

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
"""

"""
@api {post} /api/processes Start a transcription or an alignment process
@apiVersion 1.0.0
@apiName ProcessAdd
@apiGroup Transcriptions
@apiDescription This function allows you to start a process on the server. Usually, the process will be a transcription process, but you can add a process to align files too.

You can specify if you want a phone transcription by providing a "phone": true parameter in the JSON object passed in the body.

@apiParam {Integer} id The file id you want to transcribe. This id is returned after having uploaded a file.
@apiParam {Boolean} phone If the system should use the models trained for phone recordings.
@apiParam {String} type Must be set to <code>alignment</code> if you want to start an alignment process.

@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/processes"
    -X POST 
    -d '{"id":3}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

or for a phone transcription:

    curl "https://dashboard.voxolab.com/api/processes"
    -X POST 
    -d '{"id":3, "phone": true}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

or to start an alignment process (it's not language dependant):

    curl "https://dashboard.voxolab.com/api/processes"
    -X POST 
    -d '{"id":3, "type": "alignment"}'  
    -H 'Content-Type:application/json'
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'

@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "duration": null,
  "file_id": 3,
  "file_name": "lcp_q_gov_a94b9c74_fa07_4d9a_a937_b2aeeddb3830.wav",
  "id": 10,
  "progress": 0,
  "status": "Queued",
  "status_id": 1,
  "transcription_auto_name": null,
  "transcription_id": null,
  "transcription_ref_name": null,
  "type": "Full transcription"
} 

@apiSuccess {Number} id the id of the process.
@apiSuccess {String} status the status of the process. Can be one of: <code>Queued</code>, <code>Started</code>, <code>Finished</code>, <code>Error</code>
@apiSuccess {Number} status_id the status id of the process. Can be one of: <code>1</code> (Queued), <code>2</code> (Started), <code>5</code> (Finished), <code>6</code> (Error)
@apiSuccess {Number} progress the percentage of progress
"""

"""
@api {get} /api/processes/:process_id Get a process
@apiVersion 1.0.0
@apiName GetProcess
@apiGroup Transcriptions
@apiDescription Return a process object by its id. Useful to know the progess of a transcriptipon.


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/processes/12" 
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
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

@apiSuccess {Number} progress the percentage of progress
"""

"""
@api {delete} /api/processes/:process_id Delete an unstarted process
@apiVersion 1.0.0
@apiName DeleteProcess
@apiGroup Transcriptions
@apiDescription Delete a process object by its id. You can only delete queued processes


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/processes/12" 
    -X DELETE
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "success": "ok"
}

"""

"""
@api {delete} /api/files/:file_id Mark a file as to be deleted
@apiVersion 1.0.0
@apiName DeleteFile
@apiGroup Files
@apiDescription Mark a file as "to be deleted". It will be added to the daemon delete queue.


@apiExample CURL example:
    curl "https://dashboard.voxolab.com/api/files/12" 
    -X DELETE
    -H 'Authentication-Token: WyIxIiwiYWJkN2MyZDY3NGM3MDM5MjdlYjg5N2QwZTVhYWE4YmEiXQ.Bm3YZQ.LB2Wh7yLO_pRXwL0xRZ6Sf3FT28'


@apiSuccessExample Success-Response (example):
HTTP/1.0 200 OK
Content-Type: application/json
{
  "success": "ok"
}

"""


