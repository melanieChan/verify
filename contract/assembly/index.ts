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

import { Context, logging, storage, PersistentMap } from 'near-sdk-as'

const DEFAULT_MESSAGE = 'Hello'

// represents a certificate
@nearBindgen
class CertificateInfo {
  verifier: string;
  date: string;
}

// map of certificates: recipient to certificate data
const certificates = new PersistentMap<string, CertificateInfo>("certificates list");

// Exported functions will be part of the public interface for your smart contract.
// Feel free to extract behavior to non-exported functions!
export function getGreeting(accountId: string): string | null {
  // This uses raw `storage.get`, a low-level way to interact with on-chain
  // storage for simple contracts.
  // If you have something more complex, check out persistent collections:
  // https://docs.near.org/docs/concepts/data-storage#assemblyscript-collection-types
  return storage.get<string>(accountId, DEFAULT_MESSAGE)
}

export function setGreeting(message: string): void {
  const account_id = Context.sender

  // Use logging.log to record logs permanently to the blockchain!
  logging.log(
    // String interpolation (`like ${this}`) is a work in progress:
    // https://github.com/AssemblyScript/assemblyscript/pull/1115
    'Saving greeting "' + message + '" for account "' + account_id + '"'
  )

  // add cert to map
  certificates.set(message, {
    verifier: account_id,
    date: "today",
  })
  logging.log('cert added by: ' + `${certificates.getSome(message).verifier}`)

  storage.set(account_id, message)
}

// deletes a specific cert from map
export function deleteCertificate(recipient: string): void {
  logging.log("trying to delete");
  if (certificates.contains(recipient)) {
    certificates.delete(recipient);
    logging.log(recipient + ' still there? ' + `${certificates.contains(recipient)}`)
  }
}
