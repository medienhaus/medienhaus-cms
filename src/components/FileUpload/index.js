import React, { useState } from 'react'
import { Loading } from '../../components/loading'
import TextareaAutosize from 'react-textarea-autosize'
import { Trans, useTranslation } from 'react-i18next'
import { fileHandler } from '../../helpers/fileHandler'

const FileUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState()
  const [fileName, setFileName] = useState('')
  const [author, setAuthor] = useState('')
  const [license, setLicense] = useState('')
  const [alttext, setAlttext] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const size = props.fileType === 'image' ? 5000000 : 25000000
  const { t } = useTranslation('fileupload')
  const impairment = props.fileType === 'audio' ? [t('audio'), t('hearing')] : props.fileType === 'image ' ? [t('image'), t('visually')] : [t('file'), t('hearing/visually')]
  const imageFileTypes = [
    'image/apng',
    'image/gif',
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/svg+xml',
    'image/webp'
  ]
  const audioFileTypes = [
    'audio/mp3',
    'audio/flac',
    'audio/wav',
    'audio/aac',
    'audio/opus'
  ]
  const changeHandler = async (event) => {
    setErrorMessage('')

    const checkFile = await fileHandler(event.target.files[0], props.fileType)
      .catch(error => {
        if (error.message === 'file type does not match expected type') {
          setErrorMessage(<Trans t={t} i18nKey="selectFileType">Please select an {props.fileType} file.</Trans>)
        } else setErrorMessage(error.message)
      })
    if (checkFile !== undefined) {
      setSelectedFile(event.target.files[0])
      setFileName(event.target.files[0].name)
    }
  }

  return (
    <>
      <input className="browse" type="file" name="browse" onChange={changeHandler} accept={props.fileType === 'image' ? imageFileTypes : audioFileTypes} disabled={props.fileType === '' || false || props.disabled} />
      {selectedFile && (
        <>
          <input type="text" placeholder={t('author, credits, et cetera')} onChange={(e) => setAuthor(e.target.value)} />
          <select id="license" name="license" value={license} onChange={(e) => setLicense(e.target.value)}>
            <option value="" disabled>-- select license or rights statement --</option>
            <optgroup label="Creative Commons Licenses">
              <option value="cc0">CC0 1.0</option>
              <option value="cc-by">CC BY 4.0</option>
              <option value="cc-by-sa">CC BY-SA 4.0</option>
              <option value="cc-by-nc">CC BY-NC 4.0</option>
              <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
              <option value="cc-by-nd">CC BY-ND 4.0</option>
              <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
            </optgroup>
            <optgroup label="Rights Statements">
              <option value="rs-inc">In Copyright</option>
            </optgroup>
          </select>
          {/* TODO: needs i18n */}
          {license === 'cc0' && (
            <div id="cc0" className="license-info">
              <p>CC0 (aka CC Zero) is a public dedication tool, which allows creators to give up their copyright and put their works into the worldwide public domain. CC0 allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions.</p>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by' && (
            <div id="cc-by" className="license-info">
              <p>This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.</p>
              <p>CC BY includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by-sa' && (
            <div id="cc-by-sa" className="license-info">
              <p>This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.</p>
              <p>CC BY-SA includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
                <li>SA: Adaptations must be shared under the same terms</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by-nc' && (
            <div id="cc-by-nc" className="license-info">
              <p>This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.</p>
              <p>CC BY-NC includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
                <li>NC: Only noncommercial uses of the work are permitted</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by-nc-sa' && (
            <div id="cc-by-nc-sa" className="license-info">
              <p>This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.</p>
              <p>CC BY-NC-SA includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
                <li>NC: Only noncommercial uses of the work are permitted</li>
                <li>SA: Adaptations must be shared under the same terms</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by-nd' && (
            <div id="cc-by-nd" className="license-info">
              <p>This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.</p>
              <p>CC BY-ND includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
                <li>ND: No derivatives or adaptations of the work are permitted</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'cc-by-nc-nd' && (
            <div id="cc-by-nc-nd" className="license-info">
              <p>This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.</p>
              <p>CC BY-NC-ND includes the following elements:</p>
              <ul>
                <li>BY: Credit must be given to the creator</li>
                <li>NC: Only noncommercial uses of the work are permitted</li>
                <li>ND: No derivatives or adaptations of the work are permitted</li>
              </ul>
            </div>
          )}
          {/* TODO: needs i18n */}
          {license === 'rs-inc' && (
            <div id="rs-inc" className="license-info">
              <p>This Item is protected by copyright and/or related rights. You are free to use this Item in any way that is permitted by the copyright and related rights legislation that applies to your use. For other uses you need to obtain permission from the rights-holder(s).</p>
            </div>
          )}
          {/* TODO: needs i18n */}
          <p>Further information:</p>
          <ul>
            <li><a href="https://creativecommons.org/about/cclicenses/" rel="external nofollow noopener noreferrer" target="_blank">About CC Licenses</a></li>
            <li><a href="https://chooser-beta.creativecommons.org/" rel="external nofollow noopener noreferrer" target="_blank">CC License Chooser (beta)</a></li>
            <li><a href="https://rightsstatements.org/page/1.0/" rel="external nofollow noopener noreferrer" target="_blank">Rights Statements</a></li>
          </ul>
          <TextareaAutosize
            rows="3"
            placeholder={t('please describe the ') + impairment[0] + t(' with a few words for ') + impairment[1] + t(' impaired website visitors.')}
            onChange={(e) => {
              setAlttext(e.target.value)
            }}
          />
          <div className="confirmation">
            <button
              className="cancel"
              onClick={() => {
                props.callback()
                setSelectedFile('')
              }}
            >{t('CANCEL')}
            </button>
            <button
              className="upload"
              onClick={(e) => props.handleSubmission(e, selectedFile, fileName, author, license, alttext)}
              disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || props.loading || alttext.length < 1 || license.length < 1 || author.length < 1}
            >{props.loading ? <Loading /> : 'Upload'}
            </button>
          </div>
        </>
      )}
      {errorMessage && <p>❗️ {errorMessage}</p>}
    </>
  )
}

export default FileUpload
