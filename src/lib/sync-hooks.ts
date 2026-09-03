/**
 * Relie les écritures locales à la synchronisation cloud.
 *
 * Passer par les crochets Dexie plutôt que par chaque page évite d'oublier un
 * appel : toutes les pages écrivent déjà via db.<table>.put/delete, et tout
 * passe donc forcément ici. Les crochets s'exécutent à l'intérieur de la
 * transaction : on n'y fait rien d'asynchrone, `programmerEnvoi` se contente
 * d'armer un minuteur, et l'envoi réel a lieu bien après, hors transaction.
 */
import { db } from '../db'
import { programmerEnvoi } from './sync'

export function activerSyncSurEcriture() {
  const tables = [
    db.ecritures, db.comptes, db.plan, db.postes,
    db.objectifs, db.dettes, db.recurrents, db.parametres,
  ]
  for (const table of tables) {
    table.hook('creating', () => { programmerEnvoi() })
    table.hook('updating', () => { programmerEnvoi() })
    table.hook('deleting', () => { programmerEnvoi() })
  }
}
