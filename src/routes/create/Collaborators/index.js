import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import Credits from './Credits'
import { Loading } from '../../../components/loading'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../../Auth'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { debounce } from 'lodash'

const Collaborators = ({ projectSpace, members, time, startListeningToCollab }) => {
  const [isFetchingContributorSearchResults, setIsFetchingContributorSearchResults] = useState(false)
  const [contributorSearchResults, setContributorSearchResults] = useState([])
  const [contributorInput, setContributorInput] = useState('')
  const [credits, setCredits] = useState([])
  const [inviting, setInviting] = useState(false)
  const [giveWritePermission, setGiveWritePermission] = useState(false)
  const [addContributionFeedback, setAddContributionFeedback] = useState('')
  const auth = useAuth()
  const profile = auth.user
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('content')

  const checkForCredits = useCallback(async () => {
    const event = projectSpace && await matrixClient.getStateEvent(projectSpace[0].room_id, 'dev.medienhaus.meta')
    setCredits(event?.credit)
  }, [matrixClient, projectSpace])

  useEffect(() => {
    checkForCredits()
  }, [checkForCredits])

  const invite = async (e) => {
    setInviting(true)
    e?.preventDefault()
    const id = contributorInput.substring(contributorInput.lastIndexOf(' ') + 1)
    const name = contributorInput.substring(0, contributorInput.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      try {
        projectSpace.forEach(async (space, index) => {
          await matrixClient.invite(space.room_id, id)
            .then(() => {
              const room = matrixClient.getRoom(space.room_id)
              matrixClient.setPowerLevel(space.room_id, id, 100, room.currentState.getStateEvents('m.room.power_levels', ''))
            }).catch(console.log)

          if (index > 0) {
            try {
              await matrixClient.getRoomHierarchy(space.room_id)
                .then((res) => {
                  res.rooms.forEach(async (room, index) => {
                    await matrixClient.invite(room.room_id, id).catch(console.log)
                    const stateEvent = matrixClient.getRoom(projectSpace[0].room_id)
                    await matrixClient.setPowerLevel(room.room_id, id, 100, stateEvent.currentState.getStateEvents('m.room.power_levels', ''))
                      .catch(console.log)
                      .then(() => console.log('invited ' + id + ' to ' + room.name))
                  }
                  )
                })
            } catch (err) {
              console.log(err)
            }
          }
        })
        // TODO: needs i18n
        setAddContributionFeedback('✓ ' + name + t(' was invited and needs to accept your invitation'))
        time()
        setTimeout(() => {
          setAddContributionFeedback('')
          setContributorInput('')
        }, 3000)
        console.log('done')
      } catch (err) {
        console.error(err)
      } finally {
        setInviting(false)
      }
    } else {
      setAddContributionFeedback(t('You are already part of this project 🥳'))
      setTimeout(() => {
        setAddContributionFeedback('')
        setContributorInput('')
        setInviting(false)
      }, 3000)
    }
  }

  const addCredit = async (e) => {
    // @TODO for now adding credits as json key, needs to be discuessed
    setInviting(true)
    e.preventDefault()
    const content = await matrixClient.getStateEvent(projectSpace[0].room_id, 'dev.medienhaus.meta')
    content.credit ? content.credit = [...content.credit, contributorInput] : content.credit = [contributorInput]
    const sendCredit = await matrixClient.sendStateEvent(projectSpace[0].room_id, 'dev.medienhaus.meta', content)
    // TODO: needs i18n
    setAddContributionFeedback('event_id' in sendCredit ? '✓' : t('Something went wrong'))
    checkForCredits()
    time()
    setTimeout(() => {
      setAddContributionFeedback('')
      setContributorInput('')
    }, 2000)
    setInviting(false)
  }

  const onContributorInputValueChanged = (event) => {
    setGiveWritePermission(false)
    setContributorInput(event.target.value)
    debouncedFetchUsersForContributorSearch(event.target.value)
  }

  const fetchUsersForContributorSearch = useCallback(async (a) => {
    setIsFetchingContributorSearchResults(true)
    try {
      const users = await matrixClient.searchUserDirectory({ term: a })
      // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
      users.results.length > 0 && setContributorSearchResults(users.results)
    } catch (err) {
      console.error('Error whhile trying to fetch users: ' + err)
    } finally {
      setIsFetchingContributorSearchResults(false)
    }
  }, [matrixClient])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchUsersForContributorSearch = useCallback(debounce((val) => fetchUsersForContributorSearch(val), 300), [])

  const kickUser = async (name) => {
    projectSpace.forEach(async (space, index) => {
      console.log('revoking invitation from: ' + space.name)
      const subspaces = await matrixClient.getRoomHierarchy(space.room_id).catch(console.log)
      subspaces.rooms.reverse().forEach(async (space) => {
        matrixClient.kick(space.room_id, name.user.userId).catch(console.log)
      })
      matrixClient.kick(space.room_id, name.user.userId).catch(console.log)
    })
  }

  return (
    <>
      <h3>{t('Contributors')}</h3>
      <p><Trans t={t} i18nKey="contributorsInstructions2">You can share access (for editing) to this project. The contributing editor needs an <a href="https://spaces.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank">udk/spaces</a> account to edit the project.</Trans></p>
      <p><Trans t={t} i18nKey="contributorsInstructions3">You can also give credits to a contributor without an OASE account, but they won’t be able to get access for editing. Just type in their name and click the <code>ADD</code> button.</Trans></p>
      <section className="credits">
        {/* @TODO kicking user function */}
        {
          members && Object.keys(members).length > 1 &&
            <ul>
              <h4><strong>{t('CAN edit and delete(!) the project')}</strong></h4>
              {Object.values(members).filter(name => name.membership !== 'leave').map((name, i) => {
              // we filter users with the status leave since they either rejected our invitation or left the project
                startListeningToCollab()
                return name.rawDisplayName !== profile.displayname &&
                (
                  <li key={name.user?.displayName || name.rawDisplayName}>
                    <span title={name.userId}>⚠️ {name.user?.displayName || name.rawDisplayName}
                      {name.membership === 'invite' && <em> (invited)</em>}
                    </span>
                    <LoadingSpinnerButton
                      // revoking invitations / kicking a user is only possible if a users powerLevel is bigger than that of the user's in question
                      disabled={name.membership === 'join' || name.powerLevel >= members[localStorage.getItem('mx_user_id')].powerLevel}
                      onClick={() => kickUser(name)}
                      style={{ width: '2rem', height: '2rem', display: 'grid', placeContent: 'center' }}
                    >×
                    </LoadingSpinnerButton>
                  </li>
                )
              })}
            </ul>
        }
        {credits?.length > 0 &&
          <ul>
            <h4><strong>{t('CANNOT edit the project')}</strong></h4>
            {credits.map((name, index) =>
              <Credits name={name} index={index} projectSpace={projectSpace[0].room_id} callback={checkForCredits} key={index} />
            )}
            {/* eslint-disable-next-line react/jsx-closing-tag-location */}
          </ul>}
      </section>
      <div>
        <div>
          <input
            type="text"
            list="userSearch"
            placeholder={t('contributor name')}
            value={contributorInput}
            onChange={onContributorInputValueChanged}
            autoComplete="off"
          />
        </div>
        <datalist id="userSearch">
          {contributorSearchResults.map((user, i) => {
            return <option key={i} value={user.display_name + ' ' + user.user_id}>{user.display_name} ({user.user_id})</option>
          })}
        </datalist>
      </div>
      {contributorInput &&
        <div className="permissions">
          <select value={giveWritePermission} onChange={(e) => setGiveWritePermission(e.target.value)}>
            {/*
            <option value="">🚫 {contributorInput.substring(contributorInput.lastIndexOf(' ') + 1) || 'user'} {t('CANNOT edit the project')}</option>
            <option value disabled={!contributorSearchResults.some(user => user.user_id === contributorInput.substring(contributorInput.lastIndexOf(' ') + 1))}>⚠️ {contributorInput.substring(0, contributorInput.lastIndexOf(' ') + 1) || 'user'} {t('CAN edit the project')}</option>
            */}
            <option value="">🚫 {t('CANNOT edit the project')}</option>
            <option value disabled={!contributorSearchResults.some(user => user.user_id === contributorInput.substring(contributorInput.lastIndexOf(' ') + 1))}>⚠️ {t('CAN edit and delete(!) the project')}</option>
          </select>
          <div className="confirmation">
            <button className="cancel" disabled={!contributorInput || inviting || isFetchingContributorSearchResults || addContributionFeedback} onClick={() => setContributorInput('')}>{t('CANCEL')}</button>
            <button
              disabled={!contributorInput || inviting || isFetchingContributorSearchResults} onClick={(e) => {
                giveWritePermission
                  ? invite(e)
                  : addCredit(e)
              }}
            >{inviting || isFetchingContributorSearchResults ? <Loading /> || '✓' : t('SAVE')}
            </button>
          </div>
          {addContributionFeedback &&
            <p>{addContributionFeedback}</p>}
          {/*
          >{inviting || isFetchingContributorSearchResults ? <Loading /> : addContributionFeedback || (giveWritePermission ? 'ADD 🖋 ' : 'ADD 🔒')}
          */}
        </div>}
      {contributorInput && !contributorSearchResults.some(user => user.user_id === contributorInput.substring(contributorInput.lastIndexOf(' ') + 1)) && <p>❗️ {t('If you’re looking to give a user write permissions but can’t, please make sure they have already logged in to spaces.udk-berlin.de at least once.')}</p>}
    </>
  )
}

export default Collaborators
