/*
 * This is an example of an AssemblyScript smart contract with two simple,
 * symmetric functions:
 *
 * 1. setGreeting: accepts a greeting, such as "howdy", and records it for the
 *    user (account_id) who sent the request
 * 2. getGreeting: accepts an account_id and returns the greeting saved for it,
 *    defaulting to "Hello"
 *
 * Learn more about writing NEAR smart contracts with AssemblyScript:
 * https://docs.near.org/docs/develop/contracts/as/intro
 *
 */

import { Context, logging, storage, PersistentMap, PersistentSet } from 'near-sdk-as'

const DEFAULT_MESSAGE = 'Hello'

// represents a certificate
@nearBindgen
class CertificateInfo {
  verifier: string; // certificate sender
  date: string;
}

// map of certificates: recipient to certificate data
const certificates = new PersistentMap<string, CertificateInfo>("certificates list");

//  id of sender to list of ids of recipients
const senderToRecipients = new PersistentMap<string, PersistentSet<string>>("lists of verified people for each sender");

const CERT_LIMIT = 10;  // max number of certificates retrieved at a time
const recipientsArray = new Array<string>(100);

// Exported functions will be part of the public interface for your smart contract.
// Feel free to extract behavior to non-exported functions!
export function getGreeting(accountId: string): string | null {
  // This uses raw `storage.get`, a low-level way to interact with on-chain
  // storage for simple contracts.
  // If you have something more complex, check out persistent collections:
  // https://docs.near.org/docs/concepts/data-storage#assemblyscript-collection-types
  return storage.get<string>(accountId, DEFAULT_MESSAGE)
}

export function setGreeting(recipient: string): void {
  const sender = Context.sender

  // Use logging.log to record logs permanently to the blockchain!
  logging.log(
    // String interpolation (`like ${this}`) is a work in progress:
    // https://github.com/AssemblyScript/assemblyscript/pull/1115
    'Saving greeting "' + recipient + '" for account "' + sender + '"'
  )

  // add cert to map
  certificates.set(recipient, {
    verifier: sender,
    date: "today",
  })

  // Add to recipient list
  // recipientsArray.push(recipient);
// let recipientList = new PersistentSet<string>(Context.sender);
// console.log("made set");
// console.log(`has recipient list for ${sender}? ${senderToRecipients.getSome(sender).has(recipient)}`)
// if (senderToRecipients.contains(sender)) {
//   recipientList = senderToRecipients.getSome(sender);
//   console.log(`before adding`);
// }
// // add recipient to array
// recipientList.add(recipient)
// console.log("added recipient to set");
//
// // update map
// senderToRecipients.set(sender, recipientList)
//
// console.log(`after adding`);

  storage.set(sender, recipient)
}

// deletes a specific cert from map
export function deleteCertificate(recipient: string): void {
  logging.log("trying to delete");
  if (certificates.contains(recipient)) {
    certificates.delete(recipient);
    logging.log(recipient + ' still there? ' + `${certificates.contains(recipient)}`)
  }
}

// find record for a certificate recipient
export function findCertificate(recipient: string): CertificateInfo | null {
  logging.log("trying to find cert");
  if (certificates.contains(recipient)) {
    logging.log( `getting cert for ${recipient}, verified by: ${certificates.getSome(recipient).verifier}`)
    return certificates.getSome(recipient);
  }
  return null
}

export function getCertificates(): string[] {
  const result = new Array<string>(CERT_LIMIT);
  console.log(recipientsArray[0]);
  // add up to a certain limit
  // for(let i = 0; i < CERT_LIMIT; i++) {
  //     console.log(recipientsArray[i]);
  //     result[i] = recipientsArray[i];
  //     logging.log(`${result[i]}`);
  // }
  return result;
}
