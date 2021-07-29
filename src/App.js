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
class MyAppBar extends React.Component {
  render() {
    return (
      <>
      <AppBar  position="static" style={{backgroundColor: "transparent", boxShadow: "none"}}>
        <Toolbar >
            <Typography variant="h6" style={{ flex: 1 }}>
              Vaccine Verify
            </Typography>
            { /* button to sign in or sign out */
              window.walletConnection.isSignedIn() ?
              <Button style={{ color: 'turquoise'}} onClick={logout} >Logout</Button>
                : <Button style={{ color: 'turquoise'}} onClick={login} >Health Center Login</Button>
             }
          </Toolbar>
      </AppBar>
      </>
    );
  }
}


export default function App() {
  const [greeting, setGreeting] = React.useState()

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  const [certSearchButtonDisabled, setCertSearchButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const [recordRecipient, setRecordRecipient] = React.useState("")
  const [recordVerifier, setRecordVerifier] = React.useState("")
  const [recordDate, setRecordDate] = React.useState("")

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // load data from contract
        window.contract.getGreeting({ accountId: window.accountId })
          .then(greetingFromContract => {
            setGreeting(greetingFromContract)
          })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // transaction hash needed for transaction link to Near explorer
  const [hash, setHash] = React.useState("")
  const [result, setResult] = React.useState(null)

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {

    // get hash
    React.useEffect(() => {
        if (result !== null && result !== undefined) {
          // setHash(result.transaction.hash)
          console.log("hash: "+hash);
        }
        console.log("res: " + result);
      }, [result]
    )

    return (
      <>
      <MyAppBar/>
      <main>
        <h1>Verify</h1>
        <p> Search for a user to check their vaccination status </p>

        {/* Searching for verified accounts */}
        <form onSubmit={async event => {
          event.preventDefault()

          // get input from search bar using id
          const searchForMe = recipientSearchInput.value
          console.log(searchForMe);

          // call method on blockchain to get data
          try {
            setResult( await window.contract.findCertificate({
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
            }));

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
                }}>
                See Transaction</Button>
          </div>
          :
          <></>
        }
      </main>
      </>
    )
  }

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
            >
              Send vaccination certificate to
            </label>
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
          <div style={{ backgroundColor: 'rgb(255, 255, 255, 0.05)', padding: '20px' }}>
            <p>{greeting}</p>
          {/*  delete button */}
          <button onClick={ async event => {
            event.preventDefault()
            try {
              await window.contract.deleteCertificate({
                recipient: greeting
              })
            } catch (e) {
              alert(e)
          }
        }}> revoke </button>
        </div>

        </div>
        {/*
        <p>
          Look at that! A Hello World app! This greeting is stored on the NEAR blockchain. Check it out:
        </p>
        <ol>
          <li>
            Look in <code>src/App.js</code> and <code>src/utils.js</code> – you'll see <code>getGreeting</code> and <code>setGreeting</code> being called on <code>contract</code>. What's this?
          </li>
          <li>
            Ultimately, this <code>contract</code> code is defined in <code>assembly/main.ts</code> – this is the source code for your <a target="_blank" rel="noreferrer" href="https://docs.near.org/docs/develop/contracts/overview">smart contract</a>.</li>
          <li>
            When you run <code>yarn dev</code>, the code in <code>assembly/main.ts</code> gets deployed to the NEAR testnet. You can see how this happens by looking in <code>package.json</code> at the <code>scripts</code> section to find the <code>dev</code> command.</li>
        </ol>
        <hr />
        <p>
          To keep learning, check out <a target="_blank" rel="noreferrer" href="https://docs.near.org">the NEAR docs</a> or look through some <a target="_blank" rel="noreferrer" href="https://examples.near.org">example apps</a>.
        </p>
        */}
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
