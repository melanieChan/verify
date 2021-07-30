import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

// material UI AppBar with custom styling
function MyAppBar() {
  const [atHome, setAtHome] = React.useState(true) // whether or not on home page

    return (
      <div style={{height: `auto`}}>
      <AppBar  position="static" style={{backgroundColor: "transparent", boxShadow: "none"}}>
        <Toolbar >
            {/* Home button */}
            <div style={{ flex: 1 }} >
              <Button style={{ color: 'white'}} onClick={(e) => {
                  e.preventDefault();
                  // toggle state
                  if (atHome)
                    setAtHome(false);
                  else
                    setAtHome(true);
                  }}>Vaccine Verify</Button>
            </div>

            { /* button to sign in or sign out */
              window.walletConnection.isSignedIn() ?
              <Button style={{ color: 'turquoise'}} onClick={logout} >Logout</Button>
                :
                <Button style={{ color: 'turquoise'}} onClick={login} >Health Center Login</Button>
             }
          </Toolbar>
      </AppBar>

      { /* If signed in user wants to see Certificate search page */
        window.walletConnection.isSignedIn() && !atHome ?
        <main style={{height: '60vh', marginBottom: '40vh', justifyContent:'center', alignItems:'center', display: 'flex' }}>
          <CertificateSearchPage/>
        </main>
        : <></>
      }
      </div>
    );
}

// to search if someone has been verified
function CertificateSearchPage() {
  // search result content to display
  const [recordRecipient, setRecordRecipient] = React.useState("")
  const [recordVerifier, setRecordVerifier] = React.useState("")
  const [recordDate, setRecordDate] = React.useState("")

  const [certSearchButtonDisabled, setCertSearchButtonDisabled] = React.useState(true)

  // transaction hash needed for transaction link to Near explorer
  const [hash, setHash] = React.useState("")

    return (
      <div>
      <h1>Welcome to Verify</h1>
      <p> Search for a user to check their vaccination status </p>

      {/* Searching for verified accounts */}
      <form onSubmit={async event => {
        event.preventDefault()

        // get input from search bar using id
        const searchForMe = recipientSearchInput.value
        console.log(searchForMe);

        // call method on blockchain to get data
        try {
          await window.contract.findCertificate({
            recipient: searchForMe
          }).then(certificateInfo => {
            if (certificateInfo !== null) {
              // update ui to show
              setRecordRecipient(searchForMe);
              setRecordVerifier(certificateInfo.verifier);
              setRecordDate(certificateInfo.date);
              console.log(`${recordVerifier} ${recordDate}`);
            } else {
              alert(`No records found for ${searchForMe}`);
            }
          });

        } catch (e) {
          alert(
            'Something went wrong! ' + 'Check your browser console for more info.'
          )
          throw e
        }
      }}>
        <div style={{ display: 'flex' }}>
          {/* Search field */}
          <input style={{ flex: 1 }}
              id="recipientSearchInput"
              onChange={e => setCertSearchButtonDisabled(e.target.value === "") /* disable if empty input */}
              />

          {/* Search submit button */}
          <Button variant="outlined" disabled={certSearchButtonDisabled} type="submit" style={{
            borderBottomRightRadius: 35, borderTopRightRadius: 35, borderColor: "darkturquoise",
            color: "darkturquoise",
            padding: "18px 36px",
            fontSize: "18px" }}>
            Search
            </Button>
          </div>
      </form>
      { /* display certificate search result */
        recordRecipient != "" ?
        <div>
          <p>{recordRecipient} was vaccinated <br/> on {recordDate} <br/> Verified by {recordVerifier}</p>
          <Button variant="outlined" style={{ color: 'turquoise', borderColor: "darkturquoise"}} onClick={(e) => {
              e.preventDefault();
              window.open('https://explorer.testnet.near.org/transactions/', '_blank');
              }}> See Transaction</Button>
        </div>
        :
        <></>
      }
      </div>
    );
}


export default function App() {
  const [greeting, setGreeting] = React.useState()

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // list of recent recipients
  const [recentRecipients, setRecentRecipients] = React.useState([])

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <>
      <MyAppBar/>
      <main>
        <CertificateSearchPage/>
      </main>
      </>
    )
  }

  // div of a single recent recipient
  function RecipientDetails(props) {
    return (
      <div style={{ backgroundColor: 'rgb(255, 255, 255, 0.05)', padding: '20px' }}>
        <p>{props.recipient}</p>

        {/*  delete button */}
        <button onClick={ async event => {
          event.preventDefault()
          try {
            // delete from backend
            await window.contract.deleteCertificate({
              recipient: props.recipient
            })
          } catch (e) {
            alert(e)
        }
        // delete from frontend: make new array by copying over all values except value to be deleted
        setRecentRecipients( recentRecipients.filter(otherRecipient => otherRecipient != props.recipient) )
      }}> revoke </button>
      </div>
    );
  }

// if signed in
  return (
    <>
      <MyAppBar/>
      <main>
        <h1>
          <label
            htmlFor="greeting"
            style={{
              color: 'var(--secondary)',
              borderBottom: '2px solid var(--secondary)'
            }}
          >
          </label>
          Hi {window.accountId},
        </h1>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset, greeting } = event.target.elements

          // hold onto new user-entered value from React's SynthenticEvent for use after `await` call
          const newGreeting = greeting.value

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.setGreeting({
              // pass the value that the user entered in the greeting field
              recipient: newGreeting
            })
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
          }

          // update local `greeting` variable to match persisted value
          setGreeting(newGreeting)

          // add to list to be displayed
          recentRecipients.push(newGreeting);

          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          <fieldset id="fieldset">
            <label
              htmlFor="greeting"
              style={{
                display: 'block',
                color: 'var(--gray)',
                marginBottom: '0.5em'
              }}
            > Send vaccination certificate to </label>
            <div style={{ display: 'flex' }}>
              <input
                defaultValue={greeting}
                id="greeting"
                onChange={e => setButtonDisabled(e.target.value === greeting)}
                style={{ flex: 1 }}
              />
              {/* submit button */}
              <Button variant="outlined" disabled={buttonDisabled} type="submit" style={{
                borderBottomRightRadius: 35,
                borderTopRightRadius: 35,
                borderColor: "darkturquoise",

                color: "darkturquoise",
                padding: "18px 36px",
                fontSize: "18px" }}>
                Send
                </Button>
            </div>
          </fieldset>
        </form>

        {/*  details of certificate sent */}
        <div>
          <p>Vaccination certificate sent to: </p>

          { /* temporary list of recent recipients */
            recentRecipients.map((recipient) =>
            <RecipientDetails recipient={recipient} />
          )}

        </div>
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'setGreeting' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
